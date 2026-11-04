/**
 * CHAT ROUTES (/api/chat) — HYBRID AI SUPPORT CONSOLE v4
 * - Non-blocking AI: Bé Bot luôn trả lời ngay cả khi khách đang có câu hỏi khó chờ Admin giải đáp
 * - Lưu trữ đầy đủ câu hỏi chưa hiểu + ngữ cảnh các tin nhắn trước đó (context_snapshot)
 * - Chống gửi lặp tin nhắn (anti-duplicate 2s guard)
 * - Cho phép Admin trả lời trích dẫn trực tiếp vào từng câu hỏi cụ thể (reply_to_message_id / reply_to_preview)
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { optionalAuth, authenticate, requireAdmin } = require('../middleware/auth');
const { ok, badRequest, notFound } = require('../utils/http');
const aiChatService = require('../services/aiChatService');

// =====================================================================
// KHỞI TẠO / ĐỒNG BỘ LƯỢC ĐỒ BẢNG CHAT TỰ ĐỘNG (IDEMPOTENT SCHEMA)
// =====================================================================
let schemaReadyPromise = null;

function ensureChatSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      try {
        await db.query(`
          ALTER TABLE chat_conversations
            ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(40),
            ADD COLUMN IF NOT EXISTS pending_admin_count INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS last_escalated_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS last_escalated_question TEXT;
        `);
        await db.query(`
          ALTER TABLE chat_messages
            ADD COLUMN IF NOT EXISTS needs_admin_reply BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS escalation_resolved BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS escalation_reason VARCHAR(60),
            ADD COLUMN IF NOT EXISTS context_snapshot JSONB,
            ADD COLUMN IF NOT EXISTS reply_to_message_id INT,
            ADD COLUMN IF NOT EXISTS reply_to_preview TEXT;
        `);
        // Đồng bộ dữ liệu cũ (nếu trước đây cờ is_escalation gắn trên tin bot thì gắn sang câu hỏi của khách ngay trước đó)
        await db.query(`
          UPDATE chat_messages u
          SET needs_admin_reply = TRUE,
              escalation_resolved = CASE WHEN c.status IN ('resolved', 'admin_joined') THEN TRUE ELSE COALESCE(u.escalation_resolved, FALSE) END,
              escalation_reason = COALESCE(u.escalation_reason, 'not_understood')
          FROM chat_conversations c
          WHERE u.conversation_id = c.id
            AND u.sender_type = 'user'
            AND COALESCE(u.needs_admin_reply, FALSE) = FALSE
            AND EXISTS (
              SELECT 1 FROM chat_messages b
              WHERE b.conversation_id = u.conversation_id
                AND b.sender_type = 'bot'
                AND b.is_escalation = TRUE
                AND b.id > u.id
                AND NOT EXISTS (
                  SELECT 1 FROM chat_messages mid
                  WHERE mid.conversation_id = u.conversation_id
                    AND mid.sender_type = 'user'
                    AND mid.id > u.id AND mid.id < b.id
                )
            );
        `);
        await db.query(`
          UPDATE chat_conversations c
          SET pending_admin_count = sub.cnt,
              last_escalated_question = COALESCE(c.last_escalated_question, sub.last_q),
              last_escalated_at = COALESCE(c.last_escalated_at, sub.last_t)
          FROM (
            SELECT
              conv.id AS cid,
              COUNT(m.id)::int AS cnt,
              (SELECT m2.message FROM chat_messages m2
               WHERE m2.conversation_id = conv.id AND m2.sender_type = 'user'
                 AND COALESCE(m2.needs_admin_reply, FALSE) = TRUE
                 AND COALESCE(m2.escalation_resolved, FALSE) = FALSE
               ORDER BY m2.id DESC LIMIT 1) AS last_q,
              (SELECT m2.created_at FROM chat_messages m2
               WHERE m2.conversation_id = conv.id AND m2.sender_type = 'user'
                 AND COALESCE(m2.needs_admin_reply, FALSE) = TRUE
                 AND COALESCE(m2.escalation_resolved, FALSE) = FALSE
               ORDER BY m2.id DESC LIMIT 1) AS last_t
            FROM chat_conversations conv
            LEFT JOIN chat_messages m
              ON m.conversation_id = conv.id
              AND m.sender_type = 'user'
              AND COALESCE(m.needs_admin_reply, FALSE) = TRUE
              AND COALESCE(m.escalation_resolved, FALSE) = FALSE
            GROUP BY conv.id
          ) sub
          WHERE c.id = sub.cid;
        `);
        // Tối ưu hóa chỉ mục (Indexes) B-Tree để truy vấn siêu tốc O(log N) dù có hàng triệu tin nhắn
        await db.query(`
          CREATE INDEX IF NOT EXISTS idx_chat_conv_session ON chat_conversations(session_id);
          CREATE INDEX IF NOT EXISTS idx_chat_conv_status ON chat_conversations(status, updated_at);
          CREATE INDEX IF NOT EXISTS idx_chat_msg_conv_id ON chat_messages(conversation_id, id);
        `);
        // Kích hoạt dọn dẹp ngầm tự động để không bao giờ bị quá tải hoặc phình to bộ nhớ CSDL
        autoPruneOldAnonymousChats();
      } catch (err) {
        console.warn('[CHAT SCHEMA INIT]:', err.message);
      }
    })();
  }
  return schemaReadyPromise;
}

// =====================================================================
// CƠ CHẾ DỌN DẸP TỰ ĐỘNG CHỐNG QUÁ TẢI DỮ LIỆU (ZERO-BLOAT AUTO PRUNE)
// =====================================================================
let lastPruneAt = 0;
const PRUNE_THROTTLE_MS = 12 * 60 * 60 * 1000; // 12 tiếng chạy ngầm 1 lần

async function autoPruneOldAnonymousChats() {
  const now = Date.now();
  if (now - lastPruneAt < PRUNE_THROTTLE_MS) return;
  lastPruneAt = now;
  try {
    // 1. Dọn dẹp các phiên chat vãng lai cũ hơn 7 ngày:
    // CHỈ XÓA: Khách không đăng nhập, không có SĐT, không có câu hỏi chờ Admin, không có admin can thiệp
    const staleConvsRes = await db.query(`
      SELECT c.id
      FROM chat_conversations c
      WHERE c.user_id IS NULL
        AND COALESCE(c.customer_phone, '') = ''
        AND COALESCE(c.pending_admin_count, 0) = 0
        AND COALESCE(c.status, '') NOT IN ('waiting_admin', 'admin_joined')
        AND c.updated_at < NOW() - INTERVAL '7 days'
        AND NOT EXISTS (
          SELECT 1 FROM chat_messages m
          WHERE m.conversation_id = c.id
            AND (COALESCE(m.needs_admin_reply, FALSE) = TRUE OR m.sender_type = 'admin' OR COALESCE(m.is_escalation, FALSE) = TRUE)
        )
      LIMIT 200;
    `);

    const staleIds = (staleConvsRes.recordset || []).map(r => r.id).filter(Boolean);
    if (staleIds.length > 0) {
      await db.query(`
        DELETE FROM chat_messages WHERE conversation_id = ANY($1::int[]);
        DELETE FROM chat_conversations WHERE id = ANY($1::int[]);
      `, [staleIds]);
      console.log(`[ZERO-BLOAT] Đã tự động dọn dẹp ${staleIds.length} phiên chat vãng lai cũ để giải phóng bộ nhớ CSDL.`);
    }

    // 2. Cắt tỉa các phiên chat vãng lai quá dài (giữ tối đa 40 tin mới nhất mỗi phiên vãng lai - Ring Buffer)
    await db.query(`
      DELETE FROM chat_messages
      WHERE id IN (
        SELECT m.id
        FROM chat_messages m
        JOIN chat_conversations c ON c.id = m.conversation_id
        WHERE c.user_id IS NULL
          AND COALESCE(m.needs_admin_reply, FALSE) = FALSE
          AND COALESCE(m.is_escalation, FALSE) = FALSE
          AND m.id < (
            SELECT MIN(sub.id)
            FROM (
              SELECT m2.id
              FROM chat_messages m2
              WHERE m2.conversation_id = m.conversation_id
              ORDER BY m2.id DESC
              LIMIT 40
            ) sub
          )
      );
    `);
  } catch (err) {
    console.warn('[AUTO PRUNE CHAT]:', err.message);
  }
}

// Bộ nhớ chống gửi đúp tức thời theo phiên (bắt cả 2 request song song cách nhau vài mili-giây)
const sessionDedupLocks = new Map();

async function getPendingAdminCount(convId) {
  const r = await db.query(`
    SELECT COUNT(*)::int AS cnt
    FROM chat_messages
    WHERE conversation_id = @cid
      AND sender_type = 'user'
      AND COALESCE(needs_admin_reply, FALSE) = TRUE
      AND COALESCE(escalation_resolved, FALSE) = FALSE
  `, { cid: convId });
  return Number(r.recordset?.[0]?.cnt || 0);
}

// =====================================================================
// A. PHÂN HỆ KHÁCH HÀNG (CUSTOMER CHAT API)
// =====================================================================

/**
 * 1. POST /api/chat/message — Khách gửi tin nhắn
 * - Chống gửi đúp 2 lần liên tiếp (anti-duplicate 2s guard)
 * - Luôn cho phép Bé Bot AI trả lời câu mới ngay cả khi đang có câu hỏi cũ chờ Admin (Non-blocking)
 * - Nếu gặp câu hỏi khó/ngoài phạm vi -> lưu kèm các tin nhắn trước đó (context_snapshot) & báo Admin ngay
 */
router.post('/message', optionalAuth, async (req, res, next) => {
  let dedupKey = null;
  let resolveLock = null;
  try {
    await ensureChatSchema();

    const sessionId = String(req.body.sessionId || '').trim();
    const userMessage = String(req.body.message || '').trim();
    let customerName = String(req.body.customerName || (req.user ? (req.user.fullName || req.user.FullName) : '') || '').trim();
    let customerEmail = String(req.body.customerEmail || (req.user ? (req.user.email || req.user.Email) : '') || '').trim();
    let customerPhone = String(req.body.customerPhone || (req.user ? (req.user.phone || req.user.Phone) : '') || '').trim();
    let userId = (req.user && (req.user.id || req.user.userId || req.user.UserId)) ? Number(req.user.id || req.user.userId || req.user.UserId) : null;

    if (!sessionId || !userMessage) {
      throw badRequest('Thiếu sessionId hoặc nội dung tin nhắn.');
    }

    // Chốt chặn gửi đúp song song ngay trên RAM (kể cả khi request 1 chưa kịp ghi xong xuống DB)
    dedupKey = `${sessionId}::${userMessage.toLowerCase()}`;
    const prevLock = sessionDedupLocks.get(dedupKey);
    if (prevLock && (Date.now() - prevLock.ts) < 2500 && prevLock.promise) {
      const firstResult = await prevLock.promise;
      if (firstResult) {
        return ok(res, { ...firstResult, deduplicated: true }, 'Đã bỏ qua tin nhắn bị gửi đúp');
      }
    }

    const lockPromise = new Promise(r => { resolveLock = r; });
    sessionDedupLocks.set(dedupKey, { ts: Date.now(), promise: lockPromise });
    setTimeout(() => {
      const cur = sessionDedupLocks.get(dedupKey);
      if (cur && cur.promise === lockPromise) sessionDedupLocks.delete(dedupKey);
    }, 3000);

    // Bổ sung thông tin thật từ bảng Users nếu khách có đăng nhập hoặc có email
    if (userId || customerEmail) {
      try {
        const uRes = await db.query(`
          SELECT UserId, FullName, Email, Phone
          FROM Users
          WHERE (@uid::int > 0 AND UserId = @uid::int)
             OR (@em::text <> '' AND LOWER(Email) = LOWER(@em::text))
          LIMIT 1
        `, { uid: userId || 0, em: customerEmail || '' });
        if (uRes.recordset && uRes.recordset.length > 0) {
          const u = uRes.recordset[0];
          userId = userId || Number(u.userid || u.UserId || 0) || null;
          if (!customerName || customerName === 'Khách hàng') {
            customerName = String(u.fullname || u.FullName || customerName || 'Khách hàng').trim();
          }
          if (!customerEmail) {
            customerEmail = String(u.email || u.Email || '').trim();
          }
          if (!customerPhone) {
            customerPhone = String(u.phone || u.Phone || '').trim();
          }
        }
      } catch (_) {}
    }
    if (!customerName) customerName = 'Khách hàng';

    // 1. Tìm hoặc tạo cuộc hội thoại
    const convRes = await db.query(`SELECT * FROM chat_conversations WHERE session_id = @sid`, { sid: sessionId });
    let conv;

    if (convRes.recordset.length === 0) {
      const insRes = await db.query(`
        INSERT INTO chat_conversations (session_id, user_id, customer_name, customer_email, customer_phone, status, unread_admin, unread_customer, pending_admin_count)
        VALUES (@sid, @uid, @name, @email, @phone, 'bot_active', 0, 0, 0)
        RETURNING *
      `, {
        sid: sessionId,
        uid: userId,
        name: customerName,
        email: customerEmail || null,
        phone: customerPhone || null
      });
      conv = insRes.recordset[0];
    } else {
      conv = convRes.recordset[0];
      const shouldUpdateMeta =
        (customerName && customerName !== 'Khách hàng' && customerName !== conv.customer_name) ||
        (customerEmail && customerEmail !== conv.customer_email) ||
        (customerPhone && customerPhone !== conv.customer_phone) ||
        (userId && !conv.user_id);

      if (shouldUpdateMeta) {
        const nextUid = conv.user_id || userId || null;
        const nextName = (customerName && customerName !== 'Khách hàng') ? customerName : (conv.customer_name || 'Khách hàng');
        const nextEmail = customerEmail || conv.customer_email || null;
        const nextPhone = customerPhone || conv.customer_phone || null;

        const updConv = await db.query(`
          UPDATE chat_conversations
          SET user_id = @uid,
              customer_name = @name,
              customer_email = @email,
              customer_phone = @phone
          WHERE id = @id
          RETURNING *
        `, {
          uid: nextUid,
          name: nextName,
          email: nextEmail,
          phone: nextPhone,
          id: conv.id
        });
        if (updConv.recordset?.[0]) conv = updConv.recordset[0];
      }
    }

    const convId = conv.id;

    // 2. CHỐNG GỬI LẶP TIN NHẮN TRONG CSDL (Dùng đồng hồ nội bộ PostgreSQL tránh lệch múi giờ UTC/GMT+7)
    const lastUserCheck = await db.query(`
      SELECT *, EXTRACT(EPOCH FROM (NOW() - created_at)) AS age_seconds
      FROM chat_messages
      WHERE conversation_id = @cid AND sender_type = 'user'
      ORDER BY id DESC LIMIT 1
    `, { cid: convId });

    if (lastUserCheck.recordset.length > 0) {
      const prevUserMsg = lastUserCheck.recordset[0];
      const ageSec = Number(prevUserMsg.age_seconds ?? 999);
      if (
        String(prevUserMsg.message || '').trim() === userMessage &&
        ageSec >= -1 &&
        ageSec < 2.5
      ) {
        const followBotRes = await db.query(`
          SELECT * FROM chat_messages
          WHERE conversation_id = @cid AND sender_type = 'bot' AND id > @uid
          ORDER BY id ASC LIMIT 1
        `, { cid: convId, uid: prevUserMsg.id });
        const existingBotMsg = followBotRes.recordset?.[0] || null;
        await aiChatService.getStoreData();
        const dupCards = existingBotMsg
          ? aiChatService.resolveProductCardsBySkus(aiChatService.extractSkusFromText(existingBotMsg.message))
          : [];
        const pendingCnt = await getPendingAdminCount(convId);

        const dupPayload = {
          conversationId: convId,
          userMessage: prevUserMsg,
          botMessage: existingBotMsg,
          suggestions: [],
          matchedProducts: dupCards.map(c => c.sku),
          matchedProductCards: dupCards,
          catalogSig: aiChatService.getCatalogSignature(),
          status: conv.status,
          isEscalated: Boolean(prevUserMsg.needs_admin_reply),
          pendingAdminCount: pendingCnt,
          deduplicated: true
        };
        if (resolveLock) resolveLock(dupPayload);
        return ok(res, dupPayload, 'Đã bỏ qua tin nhắn bị gửi đúp');
      }
    }

    // 3. Lấy 8 tin nhắn gần nhất TRƯỚC khi chèn tin mới để làm ngữ cảnh hội thoại & snapshot siêu gọn (mảng ID)
    const priorRes = await db.query(`
      SELECT id, sender_type, sender_name, message, created_at
      FROM chat_messages
      WHERE conversation_id = @cid
      ORDER BY id DESC LIMIT 8
    `, { cid: convId });
    const priorHistory = (priorRes.recordset || []).reverse();
    // Lưu mảng ID số nguyên gọn nhẹ (< 25 byte) thay vì lặp lại toàn bộ chuỗi văn bản dài trong JSONB
    const priorContextIds = priorHistory.slice(-4).map(m => Number(m.id)).filter(Boolean);

    // 4. Lưu tin nhắn mới của Khách hàng
    const msgRes = await db.query(`
      INSERT INTO chat_messages (conversation_id, sender_type, sender_name, message, is_escalation, needs_admin_reply, escalation_resolved)
      VALUES (@cid, 'user', @name, @msg, FALSE, FALSE, FALSE)
      RETURNING *
    `, {
      cid: convId,
      name: customerName,
      msg: userMessage
    });
    let savedUserMsg = msgRes.recordset[0];

    // 5. Nếu khách bấm nút "Quay lại chat với Bé Bot"
    const normMsg = String(userMessage || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim();
    const isExplicitResumeBot = /^(quay lai chat voi be bot|chat lai voi bot|quay lai voi bot|tro lai bot)$/i.test(normMsg);

    let botResult;
    if (isExplicitResumeBot) {
      const currentPending = await getPendingAdminCount(convId);
      botResult = {
        message: currentPending > 0
          ? `Dạ **Bé Bot AI** vẫn luôn trực tuyến ở đây cùng anh/chị ạ! ✨\n*(Câu hỏi trước đó của anh/chị vẫn đang được giữ trên bảng chờ của **Admin Thịnh & Nam** để phản hồi ngay khi anh vào nhé!)*\n\nTrong lúc chờ, anh/chị muốn xem mẫu xe, hỏi giá **Box / Card**, **mã giảm giá** hay thông tin gì cứ nhắn em trả lời ngay lập tức ạ! 💕`
          : `Dạ **Bé Bot AI** đã sẵn sàng hỗ trợ anh/chị ngay đây ạ! ✨ Anh/chị cần tìm mẫu xe nào, tư vấn tầm giá hay tra cứu đơn hàng cứ nhắn em nhé! 💕`,
        isEscalated: false,
        suggestions: ['🔥 Xe sẵn hot nhất', '🏎️ Xe đua F1', '🎟️ Mã giảm giá hiện có', '👨‍💻 Ai tạo web này?'],
        matchedProducts: []
      };
    } else {
      // NON-BLOCKING AI: Bé Bot luôn đọc hiểu và trả lời thông minh các câu hỏi tiếp theo của khách
      const historyForAi = [
        ...priorHistory.map(m => ({ sender_type: m.sender_type, message: m.message })),
        { sender_type: 'user', message: userMessage }
      ];
      botResult = await aiChatService.generateBotReply(userMessage, historyForAi, {
        customerName,
        waitingAdmin: conv.status === 'waiting_admin'
      });
    }

    // 6. Nếu câu hỏi này cần chuyển lên Admin (AI không hiểu hoặc vấn đề cá nhân/đơn hàng chuyên sâu)
    if (botResult.isEscalated) {
      const reason = String(botResult.reason || 'not_understood').slice(0, 60);
      const updUserRes = await db.query(`
        UPDATE chat_messages
        SET is_escalation = TRUE,
            needs_admin_reply = TRUE,
            escalation_resolved = FALSE,
            escalation_reason = @reason,
            context_snapshot = @snap::jsonb
        WHERE id = @mid
        RETURNING *
      `, {
        reason,
        snap: JSON.stringify(priorContextIds),
        mid: savedUserMsg.id
      });
      if (updUserRes.recordset?.[0]) {
        savedUserMsg = updUserRes.recordset[0];
      }
    }

    // 7. Lưu phản hồi của Bé Bot (is_escalation = FALSE trên dòng bot để cờ escalation định danh đúng câu hỏi của khách)
    const botMsgRes = await db.query(`
      INSERT INTO chat_messages (conversation_id, sender_type, sender_name, message, is_escalation)
      VALUES (@cid, 'bot', 'Bé Bot AI Săn Xe', @msg, FALSE)
      RETURNING *
    `, {
      cid: convId,
      msg: botResult.message
    });
    const savedBotMsg = botMsgRes.recordset[0];

    // 8. Tính toán số lượng câu hỏi đang chờ Admin giải đáp (giữ nguyên trạng thái chờ Admin nếu vẫn còn câu hỏi cũ chưa giải đáp!)
    const pendingCount = await getPendingAdminCount(convId);
    let nextStatus = 'bot_active';
    if (botResult.isEscalated || pendingCount > 0) {
      nextStatus = 'waiting_admin';
    } else if (conv.status === 'admin_joined') {
      nextStatus = 'admin_joined';
    }

    if (botResult.isEscalated) {
      await db.query(`
        UPDATE chat_conversations
        SET status = @st,
            unread_admin = COALESCE(unread_admin, 0) + 1,
            pending_admin_count = @pcnt,
            last_escalated_at = NOW(),
            last_escalated_question = @q,
            updated_at = NOW()
        WHERE id = @cid
      `, {
        st: nextStatus,
        pcnt: pendingCount,
        q: userMessage.slice(0, 500),
        cid: convId
      });
    } else {
      const bumpAdmin = nextStatus === 'admin_joined' ? 1 : 0;
      await db.query(`
        UPDATE chat_conversations
        SET status = @st,
            pending_admin_count = @pcnt,
            unread_admin = COALESCE(unread_admin, 0) + @bump,
            updated_at = NOW()
        WHERE id = @cid
      `, {
        st: nextStatus,
        pcnt: pendingCount,
        bump: bumpAdmin,
        cid: convId
      });
    }

    const responsePayload = {
      conversationId: convId,
      userMessage: savedUserMsg,
      botMessage: savedBotMsg,
      suggestions: botResult.suggestions || [],
      matchedProducts: botResult.matchedProducts || [],
      matchedProductCards: botResult.matchedProductCards || [],
      catalogSig: botResult.catalogSig || aiChatService.getCatalogSignature(),
      status: nextStatus,
      isEscalated: Boolean(botResult.isEscalated),
      escalationReason: botResult.reason || null,
      pendingAdminCount: pendingCount
    };
    if (resolveLock) resolveLock(responsePayload);

    return ok(res, responsePayload, 'Đã nhận phản hồi từ trợ lý AI');

  } catch (err) {
    if (dedupKey) sessionDedupLocks.delete(dedupKey);
    if (resolveLock) resolveLock(null);
    next(err);
  }
});

function enrichMessagesWithLiveCards(rows = []) {
  if (!Array.isArray(rows) || !rows.length) return [];
  return rows.map(m => {
    if (m && m.sender_type === 'bot' && !m.is_escalation) {
      const skus = aiChatService.extractSkusFromText(m.message);
      if (skus.length > 0) {
        const cards = aiChatService.resolveProductCardsBySkus(skus);
        return {
          ...m,
          matchedProducts: cards.map(c => c.sku),
          matchedProductCards: cards
        };
      }
    }
    return m;
  });
}

/**
 * 2. GET /api/chat/messages — Lấy lịch sử chat khách hàng (hỗ trợ Incremental Sync `sinceId` + Đồng bộ thẻ sản phẩm sống)
 */
router.get('/messages', async (req, res, next) => {
  try {
    await ensureChatSchema();
    await aiChatService.getStoreData();
    const catalogSig = aiChatService.getCatalogSignature();

    const sessionId = String(req.query.sessionId || '').trim();
    const sinceId = Math.max(0, parseInt(req.query.sinceId, 10) || 0);
    if (!sessionId) {
      return ok(res, { conversation: null, messages: [], resolvedIds: [], catalogSig });
    }

    const convRes = await db.query(`
      SELECT id, session_id, user_id, customer_name, customer_email, customer_phone,
             status, unread_admin, unread_customer, pending_admin_count, updated_at
      FROM chat_conversations
      WHERE session_id = @sid
      LIMIT 1
    `, { sid: sessionId });
    if (convRes.recordset.length === 0) {
      return ok(res, { conversation: null, messages: [], resolvedIds: [], catalogSig });
    }

    const conv = convRes.recordset[0];

    if (Number(conv.unread_customer || 0) > 0) {
      await db.query(`UPDATE chat_conversations SET unread_customer = 0 WHERE id = @id`, { id: conv.id });
      conv.unread_customer = 0;
    }

    // Lấy danh sách ID các câu hỏi khó của khách đã được Admin giải đáp (để đồng bộ nhãn xanh trên khung chat khách)
    const resolvedRes = await db.query(`
      SELECT id
      FROM chat_messages
      WHERE conversation_id = @cid
        AND sender_type = 'user'
        AND COALESCE(needs_admin_reply, FALSE) = TRUE
        AND COALESCE(escalation_resolved, FALSE) = TRUE
      ORDER BY id ASC
    `, { cid: conv.id });
    const resolvedIds = (resolvedRes.recordset || []).map(r => Number(r.id));

    if (sinceId > 0) {
      const deltaRes = await db.query(`
        SELECT id, sender_type, sender_name, message, is_escalation,
               COALESCE(needs_admin_reply, FALSE) AS needs_admin_reply,
               COALESCE(escalation_resolved, FALSE) AS escalation_resolved,
               escalation_reason, reply_to_message_id, reply_to_preview, created_at
        FROM chat_messages
        WHERE conversation_id = @cid AND id > @sinceId::int
        ORDER BY id ASC
      `, { cid: conv.id, sinceId });

      const newMsgs = deltaRes.recordset || [];
      if (newMsgs.length === 0) {
        return ok(res, {
          unchanged: true,
          status: conv.status,
          pendingAdminCount: Number(conv.pending_admin_count || 0),
          resolvedIds,
          catalogSig
        });
      }

      return ok(res, {
        unchanged: false,
        incremental: true,
        conversation: conv,
        messages: enrichMessagesWithLiveCards(newMsgs),
        resolvedIds,
        catalogSig
      });
    }

    const msgsRes = await db.query(`
      SELECT id, sender_type, sender_name, message, is_escalation,
             COALESCE(needs_admin_reply, FALSE) AS needs_admin_reply,
             COALESCE(escalation_resolved, FALSE) AS escalation_resolved,
             escalation_reason, reply_to_message_id, reply_to_preview, created_at
      FROM chat_messages
      WHERE conversation_id = @cid
      ORDER BY id ASC
    `, { cid: conv.id });

    return ok(res, {
      unchanged: false,
      incremental: false,
      conversation: conv,
      messages: enrichMessagesWithLiveCards(msgsRes.recordset),
      resolvedIds,
      catalogSig
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. POST /api/chat/escalate — Khách chủ động yêu cầu gặp Admin
 */
router.post('/escalate', async (req, res, next) => {
  try {
    await ensureChatSchema();

    const sessionId = String(req.body.sessionId || '').trim();
    if (!sessionId) throw badRequest('Thiếu sessionId.');

    const convRes = await db.query(`SELECT * FROM chat_conversations WHERE session_id = @sid`, { sid: sessionId });
    if (convRes.recordset.length === 0) throw notFound('Không tìm thấy cuộc hội thoại.');

    const conv = convRes.recordset[0];

    // Đánh dấu tin nhắn gần nhất của khách (nếu có) là cần Admin hỗ trợ
    const lastUserRes = await db.query(`
      SELECT id, message FROM chat_messages
      WHERE conversation_id = @cid AND sender_type = 'user'
      ORDER BY id DESC LIMIT 1
    `, { cid: conv.id });

    let lastQ = 'Khách hàng chủ động yêu cầu gặp Admin tư vấn';
    if (lastUserRes.recordset.length > 0) {
      const lu = lastUserRes.recordset[0];
      lastQ = lu.message;
      await db.query(`
        UPDATE chat_messages
        SET is_escalation = TRUE,
            needs_admin_reply = TRUE,
            escalation_resolved = FALSE,
            escalation_reason = 'user_requested_human'
        WHERE id = @mid
      `, { mid: lu.id });
    }

    const pendingCount = await getPendingAdminCount(conv.id);

    await db.query(`
      UPDATE chat_conversations
      SET status = 'waiting_admin',
          unread_admin = COALESCE(unread_admin, 0) + 1,
          pending_admin_count = GREATEST(@pcnt, 1),
          last_escalated_at = NOW(),
          last_escalated_question = @q,
          updated_at = NOW()
      WHERE id = @id
    `, { id: conv.id, pcnt: pendingCount, q: String(lastQ).slice(0, 500) });

    const botMsgRes = await db.query(`
      INSERT INTO chat_messages (conversation_id, sender_type, sender_name, message, is_escalation)
      VALUES (@cid, 'bot', 'Bé Bot AI Săn Xe', 'Dạ em đã gửi thông báo kết nối trực tiếp tới **Admin Showroom (Thịnh & Nam)** rồi ạ! Quản trị viên sẽ phản hồi ngay tại đây. Trong lúc chờ, anh/chị vẫn có thể hỏi Bé Bot thêm bất kỳ thông tin xe nào nhé! ✨', FALSE)
      RETURNING *
    `, { cid: conv.id });

    return ok(res, {
      status: 'waiting_admin',
      pendingAdminCount: Math.max(pendingCount, 1),
      message: botMsgRes.recordset[0]
    }, 'Đã chuyển tiếp tới quản trị viên');
  } catch (err) {
    next(err);
  }
});

// =====================================================================
// B. PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN CHAT CONSOLE API)
// =====================================================================

/**
 * 4. GET /api/chat/admin/conversations — Danh sách hội thoại thực tế + KPI Summary
 */
router.get('/admin/conversations', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await ensureChatSchema();

    const status = String(req.query.status || 'all').trim();
    const search = String(req.query.search || '').trim();

    // Tính KPI tổng quan toàn bộ cuộc hội thoại thực tế (có ít nhất 1 tin nhắn)
    const summaryRes = await db.query(`
      WITH conv_stats AS (
        SELECT
          c.id,
          c.status,
          (SELECT COUNT(*)::int FROM chat_messages m WHERE m.conversation_id = c.id) AS total_msgs,
          (SELECT COUNT(*)::int FROM chat_messages m
           WHERE m.conversation_id = c.id
             AND m.sender_type = 'user'
             AND COALESCE(m.needs_admin_reply, FALSE) = TRUE
             AND COALESCE(m.escalation_resolved, FALSE) = FALSE) AS pending_q
        FROM chat_conversations c
      )
      SELECT
        COUNT(*) FILTER (WHERE total_msgs > 0)::int AS total_conversations,
        COUNT(*) FILTER (WHERE total_msgs > 0 AND (pending_q > 0 OR status = 'waiting_admin'))::int AS waiting_conversations,
        COALESCE(SUM(pending_q) FILTER (WHERE total_msgs > 0), 0)::int AS total_pending_questions,
        COUNT(*) FILTER (WHERE total_msgs > 0 AND pending_q = 0 AND status = 'admin_joined')::int AS active_admin_conversations,
        COUNT(*) FILTER (WHERE total_msgs > 0 AND pending_q = 0 AND status = 'bot_active')::int AS bot_handled_conversations,
        COUNT(*) FILTER (WHERE total_msgs > 0 AND pending_q = 0 AND status = 'resolved')::int AS resolved_conversations
      FROM conv_stats;
    `);
    const summary = summaryRes.recordset?.[0] || {
      total_conversations: 0,
      waiting_conversations: 0,
      total_pending_questions: 0,
      active_admin_conversations: 0,
      bot_handled_conversations: 0,
      resolved_conversations: 0
    };

    const params = {};
    const whereClauses = [`base.total_messages > 0`];

    if (status === 'waiting_admin') {
      whereClauses.push(`(base.pending_count > 0 OR base.status = 'waiting_admin')`);
    } else if (status === 'admin_joined') {
      whereClauses.push(`base.status = 'admin_joined'`);
    } else if (status === 'bot_active') {
      whereClauses.push(`base.pending_count = 0 AND base.status = 'bot_active'`);
    } else if (status === 'resolved') {
      whereClauses.push(`base.pending_count = 0 AND base.status = 'resolved'`);
    }

    if (search) {
      params.kw = `%${search}%`;
      whereClauses.push(`(
        COALESCE(base.customer_name, '') ILIKE @kw
        OR COALESCE(base.customer_email, '') ILIKE @kw
        OR COALESCE(base.customer_phone, '') ILIKE @kw
        OR COALESCE(base.latest_pending_question, '') ILIKE @kw
        OR COALESCE(base.last_message, '') ILIKE @kw
      )`);
    }

    const queryStr = `
      WITH base AS (
        SELECT
          c.id,
          c.session_id,
          c.user_id,
          COALESCE(NULLIF(u.FullName, ''), NULLIF(c.customer_name, ''), 'Khách vãng lai') AS customer_name,
          COALESCE(NULLIF(c.customer_email, ''), NULLIF(u.Email, '')) AS customer_email,
          COALESCE(NULLIF(c.customer_phone, ''), NULLIF(u.Phone, '')) AS customer_phone,
          u.AvatarUrl AS customer_avatar,
          c.status,
          COALESCE(c.unread_admin, 0)::int AS unread_admin,
          COALESCE(c.unread_customer, 0)::int AS unread_customer,
          c.last_escalated_at,
          c.created_at,
          c.updated_at,
          (SELECT COUNT(*)::int FROM chat_messages m WHERE m.conversation_id = c.id) AS total_messages,
          (SELECT COUNT(*)::int FROM chat_messages m WHERE m.conversation_id = c.id AND m.sender_type = 'user') AS user_messages_count,
          (SELECT COUNT(*)::int FROM chat_messages m
           WHERE m.conversation_id = c.id
             AND m.sender_type = 'user'
             AND COALESCE(m.needs_admin_reply, FALSE) = TRUE
             AND COALESCE(m.escalation_resolved, FALSE) = FALSE) AS pending_count,
          (SELECT m.message FROM chat_messages m
           WHERE m.conversation_id = c.id
             AND m.sender_type = 'user'
             AND COALESCE(m.needs_admin_reply, FALSE) = TRUE
             AND COALESCE(m.escalation_resolved, FALSE) = FALSE
           ORDER BY m.id DESC LIMIT 1) AS latest_pending_question,
          (SELECT m.escalation_reason FROM chat_messages m
           WHERE m.conversation_id = c.id
             AND m.sender_type = 'user'
             AND COALESCE(m.needs_admin_reply, FALSE) = TRUE
             AND COALESCE(m.escalation_resolved, FALSE) = FALSE
           ORDER BY m.id DESC LIMIT 1) AS latest_pending_reason,
          (SELECT m.created_at FROM chat_messages m
           WHERE m.conversation_id = c.id
             AND m.sender_type = 'user'
             AND COALESCE(m.needs_admin_reply, FALSE) = TRUE
             AND COALESCE(m.escalation_resolved, FALSE) = FALSE
           ORDER BY m.id DESC LIMIT 1) AS latest_pending_time,
          (SELECT m.message FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message,
          (SELECT m.sender_type FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_sender_type,
          (SELECT m.created_at FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message_time
        FROM chat_conversations c
        LEFT JOIN Users u
          ON (c.user_id IS NOT NULL AND u.UserId = c.user_id)
          OR (c.user_id IS NULL AND c.customer_email IS NOT NULL AND c.customer_email <> '' AND LOWER(u.Email) = LOWER(c.customer_email))
      )
      SELECT *
      FROM base
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY
        (base.pending_count > 0) DESC,
        (base.status = 'waiting_admin') DESC,
        base.unread_admin DESC,
        COALESCE(base.latest_pending_time, base.updated_at) DESC
      LIMIT 60;
    `;

    const result = await db.query(queryStr, params);
    const rows = result.recordset || [];
    const clientHash = String(req.query.clientHash || '').trim();
    const serverHash = [
      `${summary.total_conversations}.${summary.waiting_conversations}.${summary.total_pending_questions}.${summary.active_admin_conversations}.${summary.bot_handled_conversations}.${summary.resolved_conversations}`,
      ...rows.map(r => `${r.id}:${r.status}:${r.unread_admin}:${r.pending_count}:${r.total_messages}`)
    ].join('|');

    if (clientHash && clientHash === serverHash) {
      return ok(res, null, 'Unchanged', { unchanged: true, hash: serverHash, summary });
    }

    return ok(res, rows, 'Lấy danh sách hội thoại thành công', { unchanged: false, hash: serverHash, summary });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. GET /api/chat/admin/conversations/:id/messages — Chi tiết hội thoại + Danh sách câu hỏi chờ kèm ngữ cảnh (tương thích cả ID nén v5 & Object cũ)
 */
router.get('/admin/conversations/:id/messages', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await ensureChatSchema();

    const id = parseInt(req.params.id, 10);
    if (!id) throw badRequest('ID hội thoại không hợp lệ.');
    const clientSig = String(req.query.clientSig || '').trim();

    const convRes = await db.query(`
      SELECT
        c.*,
        COALESCE(NULLIF(u.FullName, ''), NULLIF(c.customer_name, ''), 'Khách vãng lai') AS real_customer_name,
        COALESCE(NULLIF(c.customer_email, ''), NULLIF(u.Email, '')) AS real_customer_email,
        COALESCE(NULLIF(c.customer_phone, ''), NULLIF(u.Phone, '')) AS real_customer_phone,
        u.AvatarUrl AS real_customer_avatar
      FROM chat_conversations c
      LEFT JOIN Users u
        ON (c.user_id IS NOT NULL AND u.UserId = c.user_id)
        OR (c.user_id IS NULL AND c.customer_email IS NOT NULL AND c.customer_email <> '' AND LOWER(u.Email) = LOWER(c.customer_email))
      WHERE c.id = @id
      LIMIT 1
    `, { id });

    if (convRes.recordset.length === 0) throw notFound('Hội thoại không tồn tại.');
    const conv = convRes.recordset[0];
    conv.customer_name = conv.real_customer_name || conv.customer_name;
    conv.customer_email = conv.real_customer_email || conv.customer_email;
    conv.customer_phone = conv.real_customer_phone || conv.customer_phone;
    conv.customer_avatar = conv.real_customer_avatar || null;

    if (Number(conv.unread_admin || 0) > 0) {
      await db.query(`UPDATE chat_conversations SET unread_admin = 0 WHERE id = @id`, { id });
      conv.unread_admin = 0;
    }

    // Kiểm tra chữ ký trạng thái siêu nhẹ trước khi kéo toàn bộ bảng tin nhắn (tiết kiệm băng thông khi Admin đang mở khung chat)
    const sigRes = await db.query(`
      SELECT
        COUNT(*)::int AS total_cnt,
        COALESCE(MAX(id), 0)::int AS max_id,
        COALESCE(STRING_AGG(
          CASE WHEN sender_type = 'user' AND COALESCE(needs_admin_reply, FALSE) = TRUE AND COALESCE(escalation_resolved, FALSE) = FALSE
               THEN id::text ELSE NULL END, ',' ORDER BY id ASC
        ), '') AS pending_ids
      FROM chat_messages
      WHERE conversation_id = @cid
    `, { cid: id });
    const sigRow = sigRes.recordset?.[0] || {};
    const serverSig = `${id}:${conv.status}:${sigRow.total_cnt || 0}:${sigRow.max_id || 0}:${sigRow.pending_ids || ''}`;

    if (clientSig && clientSig === serverSig) {
      return ok(res, { unchanged: true, sig: serverSig });
    }

    const msgsRes = await db.query(`
      SELECT id, conversation_id, sender_type, sender_name, message, is_escalation,
             COALESCE(needs_admin_reply, FALSE) AS needs_admin_reply,
             COALESCE(escalation_resolved, FALSE) AS escalation_resolved,
             escalation_reason, context_snapshot, reply_to_message_id, reply_to_preview, created_at
      FROM chat_messages
      WHERE conversation_id = @cid
      ORDER BY id ASC
    `, { cid: id });

    const allMsgs = msgsRes.recordset || [];
    const msgById = new Map(allMsgs.map(m => [Number(m.id), m]));

    // Khôi phục danh sách câu hỏi chờ Admin kèm ngữ cảnh trước đó (hỗ trợ cả mảng ID số nguyên v5 lẫn mảng Object cũ)
    const pendingQuestions = [];
    allMsgs.forEach((m, idx) => {
      if (
        m.sender_type === 'user' &&
        Boolean(m.needs_admin_reply) &&
        !Boolean(m.escalation_resolved)
      ) {
        let priorContext = [];
        if (m.context_snapshot) {
          try {
            const parsed = typeof m.context_snapshot === 'string'
              ? JSON.parse(m.context_snapshot)
              : m.context_snapshot;
            if (Array.isArray(parsed) && parsed.length > 0) {
              if (typeof parsed[0] === 'number' || typeof parsed[0] === 'string') {
                priorContext = parsed
                  .map(pid => msgById.get(Number(pid)))
                  .filter(Boolean)
                  .map(pm => ({
                    id: pm.id,
                    sender_type: pm.sender_type,
                    sender_name: pm.sender_name,
                    message: String(pm.message || '').slice(0, 350),
                    created_at: pm.created_at
                  }));
              } else if (typeof parsed[0] === 'object') {
                priorContext = parsed;
              }
            }
          } catch (_) {
            priorContext = [];
          }
        }
        if (!priorContext || priorContext.length === 0) {
          priorContext = allMsgs.slice(Math.max(0, idx - 4), idx).map(pm => ({
            id: pm.id,
            sender_type: pm.sender_type,
            sender_name: pm.sender_name,
            message: String(pm.message || '').slice(0, 350),
            created_at: pm.created_at
          }));
        }

        const followUpUserMsgs = allMsgs
          .slice(idx + 1)
          .filter(fm => fm.sender_type === 'user')
          .length;

        pendingQuestions.push({
          id: m.id,
          question: m.message,
          sender_name: m.sender_name || conv.customer_name || 'Khách hàng',
          reason: m.escalation_reason || 'not_understood',
          created_at: m.created_at,
          priorContext,
          followUpUserMsgs
        });
      }
    });

    return ok(res, {
      unchanged: false,
      sig: serverSig,
      conversation: conv,
      messages: allMsgs,
      pendingQuestions
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 6. POST /api/chat/admin/conversations/:id/reply — Admin phản hồi trực tiếp (hỗ trợ trích dẫn câu hỏi trước đó của khách)
 */
router.post('/admin/conversations/:id/reply', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await ensureChatSchema();

    const id = parseInt(req.params.id, 10);
    const replyText = String(req.body.message || '').trim();
    const rawReplyToId = req.body.replyToMessageId ? parseInt(req.body.replyToMessageId, 10) : null;
    const resolveAll = Boolean(req.body.resolveAll);

    if (!id || !replyText) throw badRequest('Thiếu nội dung phản hồi.');

    // Anti-duplicate guard 2s cho Admin tránh bấm đúp gửi 2 lần
    const dupAdminRes = await db.query(`
      SELECT *, EXTRACT(EPOCH FROM (NOW() - created_at)) AS age_seconds
      FROM chat_messages
      WHERE conversation_id = @cid AND sender_type = 'admin'
      ORDER BY id DESC LIMIT 1
    `, { cid: id });
    if (dupAdminRes.recordset.length > 0) {
      const prevAdmin = dupAdminRes.recordset[0];
      const ageSec = Number(prevAdmin.age_seconds ?? 999);
      if (String(prevAdmin.message || '').trim() === replyText && ageSec >= -1 && ageSec < 2.2) {
        return ok(res, prevAdmin, 'Đã gửi phản hồi tới khách hàng');
      }
    }

    const adminName = (req.dbUser && req.dbUser.FullName) || req.user.fullName || req.user.FullName || req.user.name || 'Admin Showroom';

    // Tìm câu hỏi khách đang chờ trả lời để trích dẫn logic (nếu Admin chọn cụ thể hoặc tự động lấy câu hỏi đang chờ)
    let targetQuestion = null;
    if (rawReplyToId) {
      const qRes = await db.query(`
        SELECT id, message FROM chat_messages
        WHERE id = @mid AND conversation_id = @cid
        LIMIT 1
      `, { mid: rawReplyToId, cid: id });
      targetQuestion = qRes.recordset?.[0] || null;
    } else {
      // Nếu chỉ có 1 câu hỏi đang chờ Admin hoặc lấy câu hỏi chờ gần nhất
      const autoQRes = await db.query(`
        SELECT id, message FROM chat_messages
        WHERE conversation_id = @cid
          AND sender_type = 'user'
          AND COALESCE(needs_admin_reply, FALSE) = TRUE
          AND COALESCE(escalation_resolved, FALSE) = FALSE
        ORDER BY id ASC
        LIMIT 1
      `, { cid: id });
      targetQuestion = autoQRes.recordset?.[0] || null;
    }

    const replyToId = targetQuestion ? Number(targetQuestion.id) : null;
    const replyPreview = targetQuestion ? String(targetQuestion.message || '').slice(0, 220) : null;

    // Lưu tin nhắn Admin kèm trích dẫn câu hỏi của khách
    const insMsg = await db.query(`
      INSERT INTO chat_messages (conversation_id, sender_type, sender_name, message, reply_to_message_id, reply_to_preview)
      VALUES (@cid, 'admin', @name, @msg, @rtid, @rprev)
      RETURNING *
    `, {
      cid: id,
      name: adminName,
      msg: replyText,
      rtid: replyToId,
      rprev: replyPreview
    });

    // Đánh dấu câu hỏi đã được Admin giải đáp
    if (resolveAll) {
      await db.query(`
        UPDATE chat_messages
        SET escalation_resolved = TRUE
        WHERE conversation_id = @cid AND COALESCE(needs_admin_reply, FALSE) = TRUE
      `, { cid: id });
    } else if (replyToId) {
      await db.query(`
        UPDATE chat_messages
        SET escalation_resolved = TRUE
        WHERE id = @mid AND conversation_id = @cid
      `, { mid: replyToId, cid: id });
    }

    const remainingPending = await getPendingAdminCount(id);
    const nextStatus = remainingPending > 0 ? 'waiting_admin' : 'admin_joined';

    await db.query(`
      UPDATE chat_conversations
      SET status = @st,
          pending_admin_count = @pcnt,
          unread_customer = COALESCE(unread_customer, 0) + 1,
          unread_admin = 0,
          updated_at = NOW()
      WHERE id = @id
    `, {
      st: nextStatus,
      pcnt: remainingPending,
      id
    });

    return ok(res, insMsg.recordset[0], 'Đã gửi phản hồi tới khách hàng', {
      remainingPending,
      status: nextStatus
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 7. PUT /api/chat/admin/conversations/:id/questions/:msgId/resolve — Đánh dấu đã xử lý 1 câu hỏi chờ
 */
router.put('/admin/conversations/:id/questions/:msgId/resolve', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await ensureChatSchema();

    const id = parseInt(req.params.id, 10);
    const msgId = parseInt(req.params.msgId, 10);
    if (!id || !msgId) throw badRequest('Tham số không hợp lệ.');

    await db.query(`
      UPDATE chat_messages
      SET escalation_resolved = TRUE
      WHERE id = @mid AND conversation_id = @cid
    `, { mid: msgId, cid: id });

    const remainingPending = await getPendingAdminCount(id);
    const nextStatus = remainingPending > 0 ? 'waiting_admin' : 'admin_joined';

    await db.query(`
      UPDATE chat_conversations
      SET pending_admin_count = @pcnt::int,
          status = CASE WHEN status = 'waiting_admin' AND @pcnt::int = 0 THEN 'admin_joined' ELSE status END,
          updated_at = NOW()
      WHERE id = @id
    `, { pcnt: remainingPending, id });

    return ok(res, { id, msgId, remainingPending, status: nextStatus }, 'Đã đánh dấu xử lý câu hỏi');
  } catch (err) {
    next(err);
  }
});

/**
 * 8. PUT /api/chat/admin/conversations/:id/status — Admin đổi trạng thái hội thoại (hoàn tất / chuyển lại AI Bot)
 */
router.put('/admin/conversations/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await ensureChatSchema();

    const id = parseInt(req.params.id, 10);
    const newStatus = String(req.body.status || 'resolved').trim();
    if (!id) throw badRequest('ID hội thoại không hợp lệ.');

    if (newStatus === 'resolved' || newStatus === 'bot_active') {
      await db.query(`
        UPDATE chat_messages
        SET escalation_resolved = TRUE
        WHERE conversation_id = @cid AND COALESCE(needs_admin_reply, FALSE) = TRUE
      `, { cid: id });
    }

    const remainingPending = await getPendingAdminCount(id);

    await db.query(`
      UPDATE chat_conversations
      SET status = @st,
          pending_admin_count = @pcnt,
          unread_admin = 0,
          updated_at = NOW()
      WHERE id = @id
    `, { st: newStatus, pcnt: remainingPending, id });

    return ok(res, { id, status: newStatus, pendingAdminCount: remainingPending }, 'Cập nhật trạng thái hội thoại thành công');
  } catch (err) {
    next(err);
  }
});

/**
 * 9. DELETE /api/chat/admin/conversations/:id — Admin xóa cuộc hội thoại không cần thiết
 */
router.delete('/admin/conversations/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await ensureChatSchema();

    const id = parseInt(req.params.id, 10);
    if (!id) throw badRequest('ID hội thoại không hợp lệ.');

    await db.query(`DELETE FROM chat_messages WHERE conversation_id = @id`, { id });
    await db.query(`DELETE FROM chat_conversations WHERE id = @id`, { id });

    return ok(res, { id }, 'Đã xóa cuộc hội thoại');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
