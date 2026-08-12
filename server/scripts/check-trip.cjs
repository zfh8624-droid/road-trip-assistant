const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
const TID = process.argv[2]
;(async () => {
  const days = await p.tripDay.findMany({ where: { tripId: TID }, orderBy: { day: 'asc' } })
  const stops = await p.tripStop.findMany({ where: { tripId: TID }, orderBy: { sort: 'asc' } })
  console.log('TripDay 行：' + days.length)
  days.forEach(d => console.log('  · D' + d.day + ' ' + d.location + ' (' + d.distanceKm + 'km)  events=' + (Array.isArray(d.events) ? d.events.length : 0) + ' 项'))
  console.log('TripStop 行：' + stops.length)
  stops.forEach(s => console.log('  · #' + s.sort + ' [' + s.category + '] ' + s.name + (s.arrivalTime ? ' @' + s.arrivalTime : '')))
  await p.$disconnect()
})().catch(e => { console.error(e); process.exit(1) })
