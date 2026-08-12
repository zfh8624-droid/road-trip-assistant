// 经典自驾路线模板（冷启动数据）
// 结构参考趣兜风：名称、起终点、建议天数、标签、每日stops、沿途精选景点/美食
export interface RouteTemplateStop {
  name: string
  location: string // lng,lat
  stay?: string
}

export interface RouteTemplate {
  id: string
  no: string
  name: string
  origin: string
  destination: string
  originLoc: string
  destLoc: string
  distanceKm: number
  days: number
  tags: string[]
  coverImage: string
  summary: string
  stops: RouteTemplateStop[]
  highlights: { name: string; type: '景点' | '美食'; info: string; image?: string; location: string; poiId?: string; address?: string; rating?: number }[]
}

export const routeTemplates: RouteTemplate[] = [
  {
    id: 'tpl_cx',
    no: '01',
    name: '川西小环线',
    origin: '成都市',
    destination: '稻城亚丁',
    originLoc: '104.0668,30.5728',
    destLoc: '100.3035,28.4831',
    distanceKm: 1240,
    days: 7,
    tags: ['自然风光', '高原', '摄影胜地'],
    coverImage: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80',
    summary: '经典川西环线，四姑娘山、新都桥、理塘、稻城亚丁一网打尽',
    stops: [
      { name: '都江堰', location: '103.6221,30.9883', stay: '午餐' },
      { name: '映秀', location: '103.4866,31.0592' },
      { name: '四姑娘山（日隆镇）', location: '102.5995,31.0576', stay: '入住' },
      { name: '丹巴', location: '101.8870,30.8782' },
      { name: '八美', location: '101.5370,30.4668' },
      { name: '新都桥', location: '101.4889,30.0789', stay: '入住' },
      { name: '理塘', location: '100.2767,29.9908', stay: '午餐' },
      { name: '稻城', location: '100.3035,28.4831', stay: '入住' },
    ],
    highlights: [
      { name: '四姑娘山 · 双桥沟', type: '景点', info: '游玩 4h · 门票 ¥150', image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=80', location: '102.6,31.1' },
      { name: '牦牛肉火锅', type: '美食', info: '日隆镇 · 人均 ¥86', location: '102.9,31.0' },
      { name: '墨石公园', type: '景点', info: '游玩 2h · 海拔 3500m', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80', location: '101.5,30.5' },
      { name: '新都桥 · 光影长廊', type: '景点', info: '免费 · 摄影推荐', image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=600&q=80', location: '101.4,30.1' },
    ]
  },
  {
    id: 'tpl_dc',
    no: '02',
    name: '滇川秘境线',
    origin: '昆明市',
    destination: '新都桥',
    originLoc: '102.8329,24.8801',
    destLoc: '101.4889,30.0789',
    distanceKm: 1680,
    days: 9,
    tags: ['自然风光', '美食', '多民族风情'],
    coverImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    summary: '从昆明出发，经西昌、雅安到成都，再北上川西',
    stops: [
      { name: '楚雄', location: '101.5460,25.0413' },
      { name: '攀枝花', location: '101.7165,26.5805', stay: '午餐' },
      { name: '西昌（邛海）', location: '102.2588,27.8855', stay: '入住' },
      { name: '雅安', location: '103.0010,29.9880' },
      { name: '成都', location: '104.0668,30.5728', stay: '入住' },
      { name: '都江堰', location: '103.6221,30.9883' },
      { name: '四姑娘山', location: '102.5995,31.0576', stay: '入住' },
      { name: '新都桥', location: '101.4889,30.0789', stay: '终点' },
    ],
    highlights: [
      { name: '昆明 · 滇池', type: '景点', info: '游玩 2h · 免费', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80', location: '102.7,24.9' },
      { name: '云南菌子火锅', type: '美食', info: '当季山珍 · 人均 ¥120', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', location: '102.8,25.1' },
      { name: '西昌 · 邛海', type: '景点', info: '环湖自驾 · 免费', image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=600&q=80', location: '102.3,27.9' },
      { name: '西昌火盆烧烤', type: '美食', info: '本地必吃 · 人均 ¥70', image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=600&q=80', location: '102.3,27.9' },
    ]
  },
  {
    id: 'tpl_gn',
    no: '03',
    name: '甘南草原线',
    origin: '兰州市',
    destination: '四姑娘山',
    originLoc: '103.8343,36.0611',
    destLoc: '102.5995,31.0576',
    distanceKm: 1520,
    days: 8,
    tags: ['草原', '人文', '藏传佛教'],
    coverImage: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=900&q=80',
    summary: '从兰州出发，经甘南草原、若尔盖、红原，南下川西',
    stops: [
      { name: '临夏', location: '103.2108,35.6012' },
      { name: '夏河（拉卜楞寺）', location: '102.5169,35.1987', stay: '入住' },
      { name: '合作', location: '102.9103,34.9868' },
      { name: '若尔盖大草原', location: '102.9620,33.5776', stay: '入住' },
      { name: '红原', location: '102.5554,32.7925' },
      { name: '马尔康', location: '102.2215,31.8989', stay: '入住' },
      { name: '小金', location: '102.3646,31.0020' },
      { name: '四姑娘山', location: '102.5995,31.0576', stay: '终点' },
    ],
    highlights: [
      { name: '兰州黄河风情线', type: '景点', info: '游玩 2h · 免费', location: '103.8,36.1' },
      { name: '兰州牛肉面', type: '美食', info: '推荐早餐 · 人均 ¥12', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80', location: '103.8,36.1' },
      { name: '若尔盖大草原', type: '景点', info: '沿途观景 · 海拔 3400m', image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=80', location: '102.9,33.6' },
      { name: '藏式土火锅', type: '美食', info: '牦牛肉汤底 · 人均 ¥85', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', location: '102.5,35.2' },
    ]
  },
  {
    id: 'tpl_ds',
    no: '04',
    name: '独库公路',
    origin: '乌鲁木齐市',
    destination: '库车市',
    originLoc: '87.6168,43.8256',
    destLoc: '82.9588,41.7178',
    distanceKm: 561,
    days: 5,
    tags: ['网红公路', '天山', '峡谷'],
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
    summary: '中国最美公路之一，一天看四季',
    stops: [
      { name: '独山子', location: '84.8956,44.3269' },
      { name: '乔尔玛', location: '84.2667,43.8000', stay: '入住' },
      { name: '那拉提', location: '84.0333,43.3167', stay: '入住' },
      { name: '巴音布鲁克', location: '84.1500,42.5333', stay: '入住' },
      { name: '大小龙池', location: '83.2000,42.1000' },
      { name: '库车', location: '82.9588,41.7178', stay: '终点' },
    ],
    highlights: [
      { name: '独山子大峡谷', type: '景点', info: '游玩 2h · 门票 ¥30', location: '84.9,44.3' },
      { name: '那拉提草原', type: '景点', info: '空中草原 · 门票 ¥95', location: '84.0,43.3' },
      { name: '巴音布鲁克九曲十八弯', type: '景点', info: '日落观景 · 门票 ¥65', location: '84.2,42.5' },
      { name: '库车大馕', type: '美食', info: '当地特色 · 人均 ¥20', location: '83.0,41.7' },
    ]
  },
  {
    id: 'tpl_qg',
    no: '05',
    name: '青甘大环线',
    origin: '西宁市',
    destination: '西宁市',
    originLoc: '101.7782,36.6171',
    destLoc: '101.7782,36.6171',
    distanceKm: 2400,
    days: 7,
    tags: ['丝绸之路', '盐湖', '沙漠'],
    coverImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80',
    summary: '青海湖、茶卡盐湖、敦煌、张掖七彩丹霞经典环线',
    stops: [
      { name: '塔尔寺', location: '101.5886,36.4957' },
      { name: '青海湖', location: '100.4889,36.7642', stay: '入住' },
      { name: '茶卡盐湖', location: '99.0833,36.7833', stay: '入住' },
      { name: '大柴旦', location: '95.3667,37.8500', stay: '入住' },
      { name: '敦煌莫高窟', location: '94.6667,40.0500', stay: '入住' },
      { name: '嘉峪关', location: '98.2833,39.7833' },
      { name: '张掖七彩丹霞', location: '100.4500,38.9333', stay: '入住' },
      { name: '西宁', location: '101.7782,36.6171', stay: '终点' },
    ],
    highlights: [
      { name: '青海湖', type: '景点', info: '中国最大咸水湖 · 免费观景', location: '100.5,36.8' },
      { name: '茶卡盐湖', type: '景点', info: '天空之镜 · 门票 ¥60', location: '99.1,36.8' },
      { name: '莫高窟', type: '景点', info: '千佛洞 · 门票 ¥238', location: '94.7,40.1' },
      { name: '张掖牛肉小饭', type: '美食', info: '当地特色早餐 · 人均 ¥15', location: '100.5,38.9' },
    ]
  },
]

export function getRouteTemplates() {
  return routeTemplates
}

export function getRouteTemplateById(id: string) {
  return routeTemplates.find(t => t.id === id)
}
