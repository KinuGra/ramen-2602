package db

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Poolはアプリ全体で使い回すDB接続プール
var Pool *pgxpool.Pool

// InitはDBに接続する。main.goの最初で1回だけ呼ぶ。
func Init() error {
	// docker-compose.ymlのenvironmentで設定したDATABASE_URLを読む
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return fmt.Errorf("DATABASE_URL is not set")
	}

	var err error
	Pool, err = pgxpool.New(context.Background(), dsn)
	if err != nil {
		return fmt.Errorf("DB接続に失敗： %w", err)
	}
	// 接続できるかテスト
	return Pool.Ping(context.Background())
}

