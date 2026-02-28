package matcher

import (
	"context"
	"time"

	"backend/db"

	"github.com/google/uuid"
)

// TryMatch は criteria_key が同じ waiting のキューを探して、
// 2人揃ったらセッションを作成する
func TryMatch(ctx context.Context, criteriaKey string) (*uuid.UUID, error) {
	// --- トランザクション開始 ---
	// （複数のSQL操作を「全部成功 or 全部取消」にするための仕組み）
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	// この関数が終わる時に、もしCommitされてなければ自動でRollback（取消）
	defer tx.Rollback(ctx)

	// --- waiting 状態のキューを2件取得 ---
	// FOR UPDATE SKIP LOCKED:
	//   他のリクエストが同時に同じ行を触るのを防ぐ（排他制御）
	//   SKIP LOCKED = 既にロックされてる行は飛ばす
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

	// 取得した行を Go の構造体に詰める
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

	// 2人揃ってなければマッチ不成立 → 何もせず終了
	if len(matched) < 2 {
		return nil, nil
	}

	// --- セッションの長さを決める ---
	// 2人の希望時間のうち短い方を採用
	duration := matched[0].DurationMin
	if matched[1].DurationMin < duration {
		duration = matched[1].DurationMin
	}

	now := time.Now()
	sessionID := uuid.New()

	// --- sessions テーブルにレコード作成 ---
	_, err = tx.Exec(ctx, `
		INSERT INTO sessions (id, criteria_key, start_at, end_at, status)
		VALUES ($1, $2, $3, $4, 'open')
	`, sessionID, criteriaKey, now, now.Add(time.Duration(duration)*time.Minute))
	if err != nil {
		return nil, err
	}

	// --- キューのステータスを matched に更新 ---
	queueIDs := []uuid.UUID{matched[0].ID, matched[1].ID}
	_, err = tx.Exec(ctx, `
		UPDATE queues SET status = 'matched', session_id = $1
		WHERE id = ANY($2)
	`, sessionID, queueIDs)
	if err != nil {
		return nil, err
	}

	// --- session_participants に2人を追加 ---
	for _, m := range matched {
		_, err = tx.Exec(ctx, `
			INSERT INTO session_participants (session_id, user_id)
			VALUES ($1, $2)
		`, sessionID, m.UserID)
		if err != nil {
			return nil, err
		}
	}

	// --- すべて成功したのでコミット（確定） ---
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &sessionID, nil
}
