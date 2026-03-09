import { requireAdmin } from '@/app/api/_lib/require-admin'
import { NextResponse } from 'next/server'

function isMissingPostViewsTableError(error: any): boolean {
  const message = String(error?.message || error || '')
  return /public\.post_views/i.test(message) || /Could not find the table/i.test(message)
}

type WeekBucket = {
  label: string
  start: Date
  end: Date
  followedFans: Set<string>
  contentFans: Set<string>
}

type CohortRow = {
  cohort: string
  cohortSize: number
  values: Array<number | null>
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diffToMonday)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toLabel(weekStart: Date) {
  return weekStart.toISOString().slice(0, 10)
}

function buildBuckets(weeks: number): WeekBucket[] {
  const now = new Date()
  const currentWeek = startOfWeek(now)
  const buckets: WeekBucket[] = []

  for (let index = weeks - 1; index >= 0; index--) {
    const start = addDays(currentWeek, -7 * index)
    const end = addDays(start, 7)
    buckets.push({
      label: toLabel(start),
      start,
      end,
      followedFans: new Set<string>(),
      contentFans: new Set<string>(),
    })
  }

  return buckets
}

function findBucket(date: Date, buckets: WeekBucket[]) {
  return buckets.find((bucket) => date >= bucket.start && date < bucket.end)
}

function weekLabel(date: Date) {
  return `Semaine du ${date.toLocaleDateString('fr-FR')}`
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin()
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth
    const { searchParams } = new URL(request.url)

    const creatorId = searchParams.get('creatorId') || 'all'
    const weeksParam = Number(searchParams.get('weeks') || 52)
    const pmfTarget = 70
    const weeks = Number.isFinite(weeksParam)
      ? Math.min(Math.max(Math.trunc(weeksParam), 1), 52)
      : 52

    const buckets = buildBuckets(weeks)
    const rangeStart = buckets[0]?.start.toISOString()

    let subsQuery = supabase
      .from('subscriptions')
      .select('fan_id, creator_id, created_at')
      .gte('created_at', rangeStart)

    if (creatorId !== 'all') {
      subsQuery = subsQuery.eq('creator_id', creatorId)
    }

    const { data: subscriptions, error: subsError } = await subsQuery
    if (subsError) {
      throw subsError
    }

    let audienceSize = 0
    if (creatorId === 'all') {
      const { count: fansCount, error: fansCountError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'fan')

      if (fansCountError) {
        throw fansCountError
      }

      audienceSize = fansCount || 0
    } else {
      const { count: creatorFansCount, error: creatorFansCountError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .eq('status', 'active')

      if (creatorFansCountError) {
        throw creatorFansCountError
      }

      audienceSize = creatorFansCount || 0
    }

    let postsQuery = supabase
      .from('posts')
      .select('id, creator_id')

    if (creatorId !== 'all') {
      postsQuery = postsQuery.eq('creator_id', creatorId)
    }

    const { data: posts, error: postsError } = await postsQuery
    if (postsError) {
      throw postsError
    }

    const postIds = (posts || []).map((post: any) => post.id)

    let postViews: Array<{ post_id: string; user_id: string; created_at: string }> = []
    let fanIds = new Set<string>()
    let selectedCreatorFanIds = new Set<string>()
    let warning: string | null = null
    let cohortRows: CohortRow[] = []

    const now = new Date()
    const currentWeekStart = startOfWeek(now)
    const firstCohortWeekStart = addDays(currentWeekStart, -7 * 11)

    if (creatorId !== 'all') {
      const { data: creatorSubscriptions, error: creatorSubscriptionsError } = await supabase
        .from('subscriptions')
        .select('fan_id')
        .eq('creator_id', creatorId)
        .eq('status', 'active')

      if (creatorSubscriptionsError) {
        throw creatorSubscriptionsError
      }

      selectedCreatorFanIds = new Set((creatorSubscriptions || []).map((row: any) => row.fan_id))
    }

    const { data: fansData, error: fansError } = await supabase
      .from('users')
      .select('id, created_at')
      .eq('role', 'fan')

    if (fansError) {
      throw fansError
    }

    const fanRows = (fansData || []) as Array<{ id: string; created_at: string }>
    fanIds = new Set(fanRows.map((fan) => fan.id))

    if (postIds.length > 0) {
      const { data: viewsData, error: viewsError } = await supabase
        .from('post_views')
        .select('post_id, user_id, created_at')
        .in('post_id', postIds)
        .gte('created_at', firstCohortWeekStart.toISOString())

      if (viewsError) {
        if (isMissingPostViewsTableError(viewsError)) {
          warning = 'post_views_table_missing'
        } else {
          throw viewsError
        }
      }

      postViews = viewsData || []
    }

    const eligibleFans = creatorId === 'all'
      ? fanRows
      : fanRows.filter((fan) => selectedCreatorFanIds.has(fan.id))

    const viewsByUserWeek = new Set<string>()
    for (const view of postViews) {
      if (creatorId !== 'all' && !selectedCreatorFanIds.has(view.user_id)) {
        continue
      }
      const viewWeek = toLabel(startOfWeek(new Date(view.created_at)))
      viewsByUserWeek.add(`${view.user_id}:${viewWeek}`)
    }

    cohortRows = []
    for (let index = 0; index < 12; index++) {
      const cohortStart = addDays(firstCohortWeekStart, 7 * index)
      const cohortEnd = addDays(cohortStart, 7)

      const cohortFans = eligibleFans.filter((fan) => {
        const createdAt = new Date(fan.created_at)
        return createdAt >= cohortStart && createdAt < cohortEnd
      })

      const cohortSize = cohortFans.length
      const values: Array<number | null> = []

      for (let weekAge = 1; weekAge <= 12; weekAge++) {
        const windowStart = addDays(cohortStart, 7 * (weekAge - 1))

        if (windowStart > now) {
          values.push(null)
          continue
        }

        if (cohortSize === 0) {
          values.push(0)
          continue
        }

        const windowWeekKey = toLabel(startOfWeek(windowStart))
        let activeCount = 0

        for (const fan of cohortFans) {
          if (viewsByUserWeek.has(`${fan.id}:${windowWeekKey}`)) {
            activeCount += 1
          }
        }

        values.push(Number(((activeCount / cohortSize) * 100).toFixed(1)))
      }

      cohortRows.push({
        cohort: weekLabel(cohortStart),
        cohortSize,
        values,
      })
    }

    for (const row of subscriptions || []) {
      const createdAt = new Date(row.created_at)
      const bucket = findBucket(createdAt, buckets)
      if (bucket) {
        bucket.followedFans.add(row.fan_id)
      }
    }

    for (const row of postViews) {
      if (fanIds.size > 0 && !fanIds.has(row.user_id)) {
        continue
      }

      if (creatorId !== 'all' && selectedCreatorFanIds.size > 0 && !selectedCreatorFanIds.has(row.user_id)) {
        continue
      }

      const createdAt = new Date(row.created_at)
      const bucket = findBucket(createdAt, buckets)
      if (bucket) {
        bucket.contentFans.add(row.user_id)
      }
    }

    const weekly = buckets.map((bucket) => {
      const contentFans = bucket.contentFans.size
      const contentRate = audienceSize > 0
        ? Number(((contentFans / audienceSize) * 100).toFixed(1))
        : 0

      return {
        week: bucket.label,
        followedFans: bucket.followedFans.size,
        contentFans,
        contentRate,
        pmfTarget,
        goalReached: contentRate >= pmfTarget,
      }
    })

    const totals = weekly.reduce(
      (acc, item) => {
        acc.followedFans += item.followedFans
        acc.contentFans += item.contentFans
        return acc
      },
      { followedFans: 0, contentFans: 0 }
    )

    const latestWeek = weekly[weekly.length - 1] || null

    return NextResponse.json({
      weekly,
      totals,
      warning,
      cohorts: {
        columns: Array.from({ length: 12 }, (_, index) => `W${index + 1}`),
        rows: cohortRows,
      },
      pmf: {
        targetRate: pmfTarget,
        audienceSize,
        latestRate: latestWeek?.contentRate || 0,
        goalReached: latestWeek ? latestWeek.contentRate >= pmfTarget : false,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}