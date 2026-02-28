package matcher

import (
	"context"
	"time"

	"backend/db"

	"github.com/google/uuid"
)

// criteriaTitle は criteria_key からセッションタイトルを返す
var criteriaTitle = map[string]string{
	"mokumoku":   "もくもく会",
	"typescript": "TypeScript 勉強会",
	"design":     "デザイン読書会",
	"dinner":     "ディナー会",
	"english":    "英会話",
}

// TryMatch は criteria_key が同じ waiting のキューを探して、
// 2人揃ったらセッションを作成する
func TryMatch(ctx context.Context, criteriaKey string) (*uuid.UUID, error) {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	rows, err := tx.Query(ctx, `
		SELECT id, user_id, duration_min
		FROM queues
		WHERE criteria_key = $1 AND status = 'waiting'
		ORDER BY created_at ASC
		LIMIT 2
		FOR UPDATE SKIP LOCKED
	`, criteriaKey)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	type queueRow struct {
		ID          uuid.UUID
		UserID      uuid.UUID
		DurationMin int
	}
	var matched []queueRow
	for rows.Next() {
		var r queueRow
		if err := rows.Scan(&r.ID, &r.UserID, &r.DurationMin); err != nil {
			return nil, err
		}
		matched = append(matched, r)
	}

	if len(matched) < 2 {
		return nil, nil
	}

	duration := matched[0].DurationMin
	if matched[1].DurationMin < duration {
		duration = matched[1].DurationMin
	}

	now := time.Now()
	sessionID := uuid.New()

	title := criteriaTitle[criteriaKey]
	if title == "" {
		title = criteriaKey
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO sessions (id, criteria_key, title, description, start_at, end_at, status)
		VALUES ($1, $2, $3, $4, $5, $6, 'open')
	`, sessionID, criteriaKey, title, "", now, now.Add(time.Duration(duration)*time.Minute))
	if err != nil {
		return nil, err
	}

	queueIDs := []uuid.UUID{matched[0].ID, matched[1].ID}
	_, err = tx.Exec(ctx, `
		UPDATE queues SET status = 'matched', session_id = $1
		WHERE id = ANY($2)
	`, sessionID, queueIDs)
	if err != nil {
		return nil, err
	}

	for _, m := range matched {
		_, err = tx.Exec(ctx, `
			INSERT INTO session_participants (session_id, user_id)
			VALUES ($1, $2)
		`, sessionID, m.UserID)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &sessionID, nil
}
