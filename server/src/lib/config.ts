import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT || 8080),
  amapKey: process.env.AMAP_KEY || '',
  amapSecret: process.env.AMAP_SECRET || '',
  wechatAppid: process.env.WECHAT_APPID || '',
  wechatSecret: process.env.WECHAT_SECRET || '',
  databaseUrl: process.env.DATABASE_URL || '',
  amapBaseUrl: 'https://restapi.amap.com/v3',
  tokenSecret: process.env.TOKEN_SECRET || 'xingye-dev-secret-change-me-in-prod',
}

export const hasAmapKey = () => !!config.amapKey
