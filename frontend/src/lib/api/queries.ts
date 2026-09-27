import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from './client'

export const queryKeys = {
  me: ['me'] as const,
  usage: ['usage'] as const,
  profile: ['profile'] as const,
  templates: ['templates'] as const,
  customTemplates: ['custom-templates'] as const,
  customTemplate: (id: string) => ['custom-templates', id] as const,
  resumes: (archived = false) => ['resumes', { archived }] as const,
  resume: (id: string) => ['resume', id] as const,
  versions: (id: string) => ['resume', id, 'versions'] as const,
  suggestions: (id: string) => ['resume', id, 'suggestions'] as const,
  shareLinks: (id: string) => ['resume', id, 'share-links'] as const,
  shareLinkStats: (id: string) => ['share-link', id, 'stats'] as const,
  jobs: ['jobs'] as const,
  job: (id: string) => ['job', id] as const,
  subscription: ['subscription'] as const,
}

export const meQuery = queryOptions({
  queryKey: queryKeys.me,
  queryFn: () => unwrap(api.GET('/v1/me')),
})

export const usageQuery = queryOptions({
  queryKey: queryKeys.usage,
  queryFn: () => unwrap(api.GET('/v1/usage')),
})

export const profileQuery = queryOptions({
  queryKey: queryKeys.profile,
  queryFn: () => unwrap(api.GET('/v1/profile')),
})

export const templatesQuery = queryOptions({
  queryKey: queryKeys.templates,
  queryFn: () => unwrap(api.GET('/v1/templates')),
  staleTime: Infinity,
})

export const customTemplatesQuery = queryOptions({
  queryKey: queryKeys.customTemplates,
  queryFn: () => unwrap(api.GET('/v1/custom-templates')),
})

export const customTemplateQuery = (customTemplateId: string) =>
  queryOptions({
    queryKey: queryKeys.customTemplate(customTemplateId),
    queryFn: () =>
      unwrap(
        api.GET('/v1/custom-templates/{customTemplateId}', {
          params: { path: { customTemplateId } },
        }),
      ),
  })

export const resumesQuery = (archived = false) =>
  queryOptions({
    queryKey: queryKeys.resumes(archived),
    queryFn: () =>
      unwrap(
        api.GET('/v1/resumes', {
          params: { query: { archived: String(archived) as never } },
        }),
      ),
  })

export const resumeQuery = (resumeId: string) =>
  queryOptions({
    queryKey: queryKeys.resume(resumeId),
    queryFn: () =>
      unwrap(
        api.GET('/v1/resumes/{resumeId}', { params: { path: { resumeId } } }),
      ),
  })

export const versionsQuery = (resumeId: string) =>
  queryOptions({
    queryKey: queryKeys.versions(resumeId),
    queryFn: () =>
      unwrap(
        api.GET('/v1/resumes/{resumeId}/versions', {
          params: { path: { resumeId }, query: { limit: 100 as never } },
        }),
      ),
  })

export const jobsQuery = queryOptions({
  queryKey: queryKeys.jobs,
  queryFn: () => unwrap(api.GET('/v1/jobs')),
})

export const jobQuery = (jobId: string) =>
  queryOptions({
    queryKey: queryKeys.job(jobId),
    queryFn: () =>
      unwrap(api.GET('/v1/jobs/{jobId}', { params: { path: { jobId } } })),
  })

export const shareLinksQuery = (resumeId: string) =>
  queryOptions({
    queryKey: queryKeys.shareLinks(resumeId),
    queryFn: () =>
      unwrap(
        api.GET('/v1/resumes/{resumeId}/share-links', {
          params: { path: { resumeId } },
        }),
      ),
  })

export const shareLinkStatsQuery = (shareLinkId: string) =>
  queryOptions({
    queryKey: queryKeys.shareLinkStats(shareLinkId),
    queryFn: () =>
      unwrap(
        api.GET('/v1/share-links/{shareLinkId}/stats', {
          params: { path: { shareLinkId } },
        }),
      ),
  })

export const suggestionsQuery = (resumeId: string) =>
  queryOptions({
    queryKey: queryKeys.suggestions(resumeId),
    queryFn: () =>
      unwrap(
        api.GET('/v1/resumes/{resumeId}/suggestions', {
          params: { path: { resumeId } },
        }),
      ),
  })

export const subscriptionQuery = queryOptions({
  queryKey: queryKeys.subscription,
  queryFn: () => unwrap(api.GET('/v1/subscription')),
})
