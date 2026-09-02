import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header / Logo Area */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            ProjectFlow
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to your SaaS account
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <LoginForm />
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <a href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            Register here
          </a>
        </p>
      </div>
    </div>
  )
}
