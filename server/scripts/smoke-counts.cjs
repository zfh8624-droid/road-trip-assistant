const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
const TRIP_ID = process.argv[2]
;(async () => {
  const [userCnt, tripCnt, memberCnt, dayCnt, stopCnt, favCnt, invCnt] = await Promise.all([
    p.user.count(), p.trip.count(), p.tripMember.count(),
    p.tripDay.count(), p.tripStop.count(), p.favorite.count(), p.invitation.count(),
  ])
  console.log('User        :', userCnt)
  console.log('Trip        :', tripCnt)
  console.log('TripMember  :', memberCnt)
  console.log('TripDay     :', dayCnt)
  console.log('TripStop    :', stopCnt)
  console.log('Favorite    :', favCnt)
  console.log('Invitation  :', invCnt)
  const days = await p.tripDay.findMany({ where: { tripId: TRIP_ID }, orderBy: { day: 'asc' } })
  const stops = await p.tripStop.findMany({ where: { tripId: TRIP_ID }, orderBy: { sort: 'asc' } })
  const extra = stops.length > 6 ? ` +${stops.length - 6}个` : ''
  console.log('')
  console.log('✅ 该行程 TripDay 行:', days.length, days.map(d=>'D'+d.day+' '+d.location+'('+d.distanceKm+'km)').join(' → '))
  console.log('✅ 该行程 TripStop 行:', stops.length, stops.slice(0,6).map(s=>s.name).join(', '), extra)
  await p.$disconnect()
})()
