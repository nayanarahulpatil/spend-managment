import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { clearCredentials, setCredentials } from '../store';

const baseQuery = fetchBaseQuery({
  baseUrl: '/',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');
    const userRole = localStorage.getItem('user_role');
    if (refreshToken) {
      // Avoid recursive refresh loops
      const urlPath = typeof args === 'string' ? args : args.url;
      if (urlPath !== 'api/v1/auth/refresh') {
        const refreshResult = await baseQuery(
          {
            url: 'api/v1/auth/refresh',
            method: 'POST',
            body: { refresh_token: refreshToken },
          },
          api,
          extraOptions
        );

        const resBody = refreshResult.data as any;
        if (resBody && resBody.status === 200 && resBody.data) {
          const { access_token, refresh_token } = resBody.data;
          
          // Save new credentials
          api.dispatch(
            setCredentials({
              access_token,
              refresh_token: refresh_token || refreshToken,
              role: userRole || '',
            })
          );

          // Retry the original query
          result = await baseQuery(args, api, extraOptions);
        } else {
          api.dispatch(clearCredentials());
        }
      }
    } else {
      api.dispatch(clearCredentials());
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Expenses', 'Workflow', 'Notifications', 'Users'],
  endpoints: (builder) => ({
    // Auth Module
    login: builder.mutation({
      query: (credentials) => ({
        url: 'api/v1/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    refresh: builder.mutation({
      query: (refreshToken) => ({
        url: 'api/v1/auth/refresh',
        method: 'POST',
        body: { refresh_token: refreshToken },
      }),
    }),
    logout: builder.mutation({
      query: (refreshToken) => ({
        url: 'api/v1/auth/logout',
        method: 'POST',
        body: { refresh_token: refreshToken },
      }),
    }),

    // Expenses Module
    getExpenses: builder.query({
      query: (status) => `api/v1/expenses${status ? `?status=${status}` : ''}`,
      providesTags: ['Expenses'],
    }),
    submitExpense: builder.mutation({
      query: ({ expense, idempotencyKey }) => ({
        url: 'api/v1/expenses',
        method: 'POST',
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
        body: expense,
      }),
      invalidatesTags: ['Expenses', 'Workflow'],
    }),
    uploadReceipt: builder.mutation({
      query: (formData) => ({
        url: 'api/v1/expenses/receipt/upload',
        method: 'POST',
        body: formData,
      }),
    }),

    // Workflow Module
    getWorkflowQueue: builder.query({
      query: () => 'api/v1/workflows/queue',
      providesTags: ['Workflow'],
    }),
    approveExpense: builder.mutation({
      query: ({ id, comment }) => ({
        url: `api/v1/workflows/expenses/${id}/approve`,
        method: 'POST',
        body: { comment },
      }),
      invalidatesTags: ['Workflow', 'Expenses'],
    }),
    rejectExpense: builder.mutation({
      query: ({ id, reason }) => ({
        url: `api/v1/workflows/expenses/${id}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Workflow', 'Expenses'],
    }),
    requestMoreInfo: builder.mutation({
      query: ({ id, message }) => ({
        url: `api/v1/workflows/expenses/${id}/request-info`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: ['Workflow', 'Expenses'],
    }),
    getWorkflowRules: builder.query({
      query: () => 'api/v1/workflows/rules',
      providesTags: ['Workflow'],
    }),
    updateWorkflowRules: builder.mutation({
      query: (levels) => ({
        url: 'api/v1/workflows/rules',
        method: 'POST',
        body: { levels },
      }),
      invalidatesTags: ['Workflow'],
    }),
    applyAiWorkflowRules: builder.mutation({
      query: () => ({
        url: 'api/v1/workflows/rules/apply-ai',
        method: 'POST',
      }),
      invalidatesTags: ['Workflow'],
    }),

    // User Management Module
    getUsers: builder.query({
      query: () => 'api/v1/users',
      providesTags: ['Users'],
    }),
    createUser: builder.mutation({
      query: (user) => ({
        url: 'api/v1/users',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: ['Users'],
    }),

    // Notifications Module
    getNotifications: builder.query({
      query: () => 'api/v1/notifications',
      providesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `api/v1/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),

    // Reporting & Audit Module
    generateReport: builder.mutation({
      query: (params) => ({
        url: 'api/v1/reports/generate',
        method: 'POST',
        body: params,
      }),
    }),
    getAuditLogs: builder.query({
      query: () => 'api/v1/audit/logs',
    }),

    // AI Assistant Module
    aiChat: builder.mutation({
      query: (body) => ({
        url: 'api/v1/ai/chat',
        method: 'POST',
        body,
      }),
    }),
    aiCategorize: builder.mutation({
      query: (body) => ({
        url: 'api/v1/ai/categorize',
        method: 'POST',
        body,
      }),
    }),

    // Dashboards
    getEmployeeDashboard: builder.query({
      query: () => 'api/v1/dashboard/employee',
      providesTags: ['Expenses'],
    }),
    getManagerDashboard: builder.query({
      query: () => 'api/v1/dashboard/manager',
      providesTags: ['Workflow', 'Expenses'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useGetExpensesQuery,
  useSubmitExpenseMutation,
  useUploadReceiptMutation,
  useGetWorkflowQueueQuery,
  useApproveExpenseMutation,
  useRejectExpenseMutation,
  useRequestMoreInfoMutation,
  useGetWorkflowRulesQuery,
  useUpdateWorkflowRulesMutation,
  useApplyAiWorkflowRulesMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useGenerateReportMutation,
  useGetAuditLogsQuery,
  useAiChatMutation,
  useAiCategorizeMutation,
  useGetEmployeeDashboardQuery,
  useGetManagerDashboardQuery,
} = api;
