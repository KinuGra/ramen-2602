package handler

import (
	"net/http"

	"backend/db"
	"backend/matcher"
	"backend/model"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Enqueue は POST /queues のハンドラ
// 「マッチング待ちに参加する」API
func Enqueue(c *gin.Context) {
	// 1. リクエストボディを読み取る
	var req model.EnqueueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// バリデーションエラー（必須項目が足りない等）
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := uuid.Parse(req.UserID)
	queueID := uuid.New() // 新しいUUIDを生成

	// 2. queues テーブルにレコードを追加
	_, err := db.Pool.Exec(c.Request.Context(), `
		INSERT INTO queues (id, user_id, criteria_key, duration_min, status)
		VALUES ($1, $2, $3, $4, 'waiting')
	`, queueID, userID, req.CriteriaKey, req.DurationMin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 3. マッチングを試行する
	sessionID, err := matcher.TryMatch(c.Request.Context(), req.CriteriaKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 4. レスポンスを返す
	resp := gin.H{
		"queue_id": queueID,
		"status":   "waiting",
	}
	if sessionID != nil {
		// マッチ成立！
		resp["status"] = "matched"
		resp["session_id"] = sessionID
	}
	c.JSON(http.StatusCreated, resp)
}

// CancelQueue は DELETE /queues/:id のハンドラ
// 「マッチング待ちをキャンセルする」API
func CancelQueue(c *gin.Context) {
	// URLパラメータ（:id の部分）を取得
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid uuid"})
		return
	}

	// waiting のものだけキャンセル可能
	tag, err := db.Pool.Exec(c.Request.Context(), `
		UPDATE queues SET status = 'canceled'
		WHERE id = $1 AND status = 'waiting'
	`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// RowsAffected() = 更新された行数。0なら該当なし
	if tag.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "queue not found or already matched"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "canceled"})
}
