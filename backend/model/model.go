package model

import (
	"time"

	"github.com/google/uuid"
)

// Queue はマッチング待ちの1レコード
type Queue struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	CriteriaKey string     `json:"criteria_key"`
	DurationMin int        `json:"duration_min"`
	Status      string     `json:"status"`
	SessionID   *uuid.UUID `json:"session_id,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

// Session はマッチ成立後のセッション
type Session struct {
	ID          uuid.UUID `json:"id"`
	CriteriaKey string    `json:"criteria_key"`
	StartAt     time.Time `json:"start_at"`
	EndAt       time.Time `json:"end_at"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

// EnqueueRequest はPOST /queues のリクエストボディ
type EnqueueRequest struct {
	UserID      string `json:"user_id"      binding:"required,uuid"`
	CriteriaKey string `json:"criteria_key" binding:"required"`
	DurationMin int    `json:"duration_min" binding:"required,min=1"`
}
