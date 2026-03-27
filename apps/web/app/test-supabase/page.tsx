import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div className="container py-24">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      {(!todos || todos.length === 0) ? (
        <p className="text-gray-500 text-sm">No todos found or "todos" table doesn't exist.</p>
      ) : (
        <ul className="space-y-2">
          {todos?.map((todo: any) => (
            <li key={todo.id} className="p-4 border border-gray-100 rounded">
              {todo.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
