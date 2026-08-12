const cities = ['北京市','上海市','天津市','重庆市','成都市','广州市','深圳市','杭州市','南京市','武汉市','西安市','昆明市','贵阳市','兰州市','西宁市','拉萨市','乌鲁木齐市','哈尔滨市','长春市','沈阳市','大连市','济南市','青岛市','郑州市','长沙市','南昌市','福州市','厦门市','南宁市','桂林市','海口市','三亚市','太原市','石家庄市','呼和浩特市','银川市','张家界市','丽江市','大理市']

const routes = [
  { no:'01', name:'川西小环线', origin:'成都市', destination:'稻城', distance:'1,240 km', days:7, stops:['都江堰','映秀','四姑娘山','丹巴','八美','新都桥','理塘','稻城'], spots:[
    {name:'四姑娘山 · 双桥沟',type:'景点',info:'游玩 4h · 门票 ¥150',image:'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=80'},
    {name:'牦牛肉火锅',type:'美食',info:'日隆镇 · 人均 ¥86',image:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80'},
    {name:'墨石公园',type:'景点',info:'游玩 2h · 海拔 3500m',image:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'},
    {name:'新都桥 · 光影长廊',type:'景点',info:'免费 · 摄影推荐',image:'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=600&q=80'}]},
  { no:'02', name:'滇川秘境线', origin:'昆明市', destination:'新都桥', distance:'1,680 km', days:9, stops:['昆明','楚雄','攀枝花','西昌','雅安','成都','都江堰','四姑娘山','新都桥'], spots:[
    {name:'昆明 · 滇池',type:'景点',info:'游玩 2h · 免费',image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80'},
    {name:'云南菌子火锅',type:'美食',info:'当季山珍 · 人均 ¥120',image:'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80'},
    {name:'西昌 · 邛海',type:'景点',info:'环湖自驾 · 免费',image:'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=600&q=80'},
    {name:'西昌火盆烧烤',type:'美食',info:'本地必吃 · 人均 ¥70',image:'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=600&q=80'}]},
  { no:'03', name:'甘南草原线', origin:'兰州市', destination:'四姑娘山', distance:'1,520 km', days:8, stops:['兰州','临夏','夏河','合作','若尔盖','红原','马尔康','小金','四姑娘山'], spots:[
    {name:'兰州黄河风情线',type:'景点',info:'游玩 2h · 免费',image:'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=600&q=80'},
    {name:'兰州牛肉面',type:'美食',info:'推荐早餐 · 人均 ¥12',image:'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80'},
    {name:'若尔盖大草原',type:'景点',info:'沿途观景 · 海拔 3400m',image:'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=80'},
    {name:'藏式土火锅',type:'美食',info:'牦牛肉汤底 · 人均 ¥85',image:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80'}]}
]

function buildSchedule(route, origin, destination) {
  const stops = [origin.replace(/市$/, ''), ...route.stops]
  stops[stops.length - 1] = destination
  return Array.from({length: route.days}, (_, i) => {
    const fromIndex = Math.floor(i * (stops.length - 1) / route.days)
    const toIndex = Math.max(fromIndex + 1, Math.floor((i + 1) * (stops.length - 1) / route.days))
    const from = stops[fromIndex], to = stops[Math.min(toIndex, stops.length - 1)]
    const spot = route.spots.find((_, j) => i === Math.round((j + 1) * route.days / 5) - 1)
    const events = i === 0 ? [
      {time:'07:30',title:`从家出发 · ${from} → ${to}`,desc:'直接进入导航，不在出发地停留'},
      {time:'10:30',title:'服务区短暂休息',desc:'检查车辆状态，按需补给'},
      {time:'12:30',title:`沿途午餐 · ${to}`,desc:'到达目的地附近后用餐'},
      {time:'17:00',title:`抵达并入住 ${to}`,desc:'查看次日路况，早点休息'}
    ] : [
      {time:'08:30',title:`${from} → ${to}`,desc:`导航前往 ${to}`},
      {time:'12:30',title:spot&&spot.type==='美食'?`午餐 · ${spot.name}`:`沿途午餐 · ${to}`,desc:'预留一小时用餐和休息'},
      {time:'15:00',title:spot&&spot.type==='景点'?spot.name:`${to} 沿途观景`,desc:spot?spot.info:'根据到达时间灵活停留'},
      {time:'18:30',title:`入住 ${to}`,desc:'补充燃油或充电'}
    ]
    return {day:String(i+1).padStart(2,'0'), location:to, events}
  })
}

Page({
  data:{ routeIndex:0, route:{}, origin:'成都市', destination:'稻城', cities, filter:'全部', filteredSpots:[], schedule:[], activeDay:0, currentEvents:[], tab:'探索', favorites:[], companions:[], showRouteForm:false, showProfile:false, preferenceOptions:['自然风光','当地美食','亲子友好','小众秘境','充电便利','避开高原'], selectedPreferences:['自然风光','当地美食'], preferences:'轻松驾驶 · 自然风光 · 当地美食' },
  onLoad(){ this.applyRoute(0); this.setData({favorites:wx.getStorageSync('favorites')||[],companions:wx.getStorageSync('companions')||[]}) },
  applyRoute(index){const raw=routes[index],favorites=wx.getStorageSync('favorites')||[];const route={...raw,path:`${raw.origin.replace(/市$/,'')} → ${raw.stops.slice(1,-1).join(' → ')} → ${raw.destination}`,spots:raw.spots.map(s=>({...s,saved:favorites.includes(s.name)}))};const schedule=buildSchedule(route,raw.origin,raw.destination);this.setData({routeIndex:index,route,origin:raw.origin,destination:raw.destination,schedule,activeDay:0,currentEvents:schedule[0].events,filteredSpots:route.spots})},
  switchRoute(){const next=(this.data.routeIndex+1)%routes.length;this.applyRoute(next);wx.showToast({title:`路线 ${routes[next].no} 日程已更新`,icon:'none'})},
  openRouteForm(){this.setData({showRouteForm:true})},openDestination(){this.setData({showRouteForm:true})},closeModal(){this.setData({showRouteForm:false,showProfile:false})},noop(){},
  pickOrigin(e){this.setData({origin:cities[e.detail.value]})},pickDestination(e){this.setData({destination:cities[e.detail.value]})},setPreferences(e){this.setData({selectedPreferences:e.detail.value})},
  saveRoute(){const route={...this.data.route,origin:this.data.origin,destination:this.data.destination,path:`${this.data.origin.replace(/市$/,'')} → 沿途精选 → ${this.data.destination}`};const schedule=buildSchedule(route,this.data.origin,this.data.destination);this.setData({route,schedule,activeDay:0,currentEvents:schedule[0].events,preferences:`轻松驾驶 · ${this.data.selectedPreferences.join(' · ')}`,showRouteForm:false});wx.showToast({title:'全国路线已生成',icon:'success'})},
  generateTrip(){const schedule=buildSchedule(this.data.route,this.data.origin,this.data.destination);this.setData({schedule,activeDay:0,currentEvents:schedule[0].events});wx.showToast({title:'行程已生成',icon:'success'})},
  selectDay(e){const activeDay=Number(e.currentTarget.dataset.index);this.setData({activeDay,currentEvents:this.data.schedule[activeDay].events})},
  setFilter(e){const filter=e.currentTarget.dataset.filter;this.setData({filter,filteredSpots:filter==='全部'?this.data.route.spots:this.data.route.spots.filter(s=>s.type===filter)})},
  toggleFavorite(e){const name=e.currentTarget.dataset.name;let favorites=[...this.data.favorites];favorites=favorites.includes(name)?favorites.filter(x=>x!==name):[...favorites,name];wx.setStorageSync('favorites',favorites);const spots=this.data.route.spots.map(s=>({...s,saved:favorites.includes(s.name)}));this.setData({favorites,route:{...this.data.route,spots},filteredSpots:this.data.filter==='全部'?spots:spots.filter(s=>s.type===this.data.filter)})},
  showSpot(e){const spot=this.data.filteredSpots[e.currentTarget.dataset.index];wx.showModal({title:spot.name,content:spot.info+'\n已加入当前导航路线。出发前请确认开放时间和实时路况。',confirmText:'知道了',showCancel:false})},
  setTab(e){const tab=e.currentTarget.dataset.tab;if(tab==='我的')this.setData({showProfile:true});if(tab==='收藏')this.setData({filteredSpots:this.data.route.spots.filter(s=>this.data.favorites.includes(s.name)),filter:'全部'});if(tab==='探索')this.setData({filteredSpots:this.data.route.spots,filter:'全部'});if(tab==='行程')wx.pageScrollTo({selector:'#schedule',duration:300});this.setData({tab})},
  openSupplyMap(e){const keyword=`${this.data.schedule[this.data.activeDay].location}${e.currentTarget.dataset.type||'加油站 充电站'}`;wx.openLocation({latitude:30.659462,longitude:104.065735,name:keyword,address:'请在地图中搜索并选择实时站点',fail:()=>wx.showToast({title:'请在微信设置中允许位置权限',icon:'none'})})},
  onShareAppMessage(){return{title:`邀请你加入${this.data.route.name}：${this.data.route.path}`,path:`/pages/index/index?route=${this.data.routeIndex}`}}
})
