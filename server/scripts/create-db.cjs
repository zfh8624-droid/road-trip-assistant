// 一次性：在 PG 实例上为行野项目创建独立数据库（复用已有登录账号）
// 用法：
//   PGHOST=xx PGPORT=5432 PGUSER=root PGPASSWORD=xxx PGADMINDB=postgres CREATEDB=xingye node scripts/create-db.cjs
const { Client } = require('pg')

const conn = {
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'root',
  password: process.env.PGPASSWORD,
  database: process.env.PGADMINDB || 'postgres', // 先连到一个已存在的库（postgres/zeabur 等）
}

const NEW_DB = process.env.CREATEDB || 'xingye'
const OWNER = process.env.PGUSER || 'root'

async function main() {
  if (!conn.password) {
    console.error('❌ 请先设置环境变量 PGPASSWORD（推荐）或修改脚本。切勿将密码写入仓库！')
    process.exit(1)
  }
  const client = new Client(conn)
  await client.connect()
  console.log(`已连接 ${conn.host}:${conn.port}/${conn.database}  user=${conn.user}`)

  const exists = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [NEW_DB]
  )
  if (exists.rowCount > 0) {
    console.log(`数据库 ${NEW_DB} 已存在，跳过创建`)
  } else {
    const sql = `CREATE DATABASE "${NEW_DB}" OWNER "${OWNER}"`
    await client.query(sql)
    console.log(`✅ 已创建数据库 ${NEW_DB}，owner=${OWNER}`)
  }
  await client.end()

  // 切到新库，确保 schema public 权限和 pgcrypto
  const newClient = new Client({ ...conn, database: NEW_DB })
  await newClient.connect()
  await newClient.query(`GRANT ALL ON SCHEMA public TO "${OWNER}"`)
  await newClient.query(`GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO "${OWNER}"`)
  await newClient.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
  console.log('✅ schema public 权限与 pgcrypto 已就绪')
  await newClient.end()
}

main().catch(e => {
  console.error('❌', e.message)
  process.exit(1)
})
