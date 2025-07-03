/**
 * Mock Xata client for development/demo purposes.
 * Replace with real Xata SDK when connecting to production database.
 */
export function getXataClient() {
  const mockRecord = {
    id: "mock-id",
    name: "Mock File",
    content: "Mock content",
    userId: "mock-user",
    summary: "Mock summary",
    flashcards: [],
  }

  return {
    db: {
      Files: {
        read: async (id: string) => {
          console.log(`Mock: Reading file ${id}`)
          return mockRecord
        },
        create: async (data: any) => {
          console.log("Mock: Creating file", data)
          return { ...mockRecord, ...data, id: `mock-${Date.now()}` }
        },
        update: async (id: string, data: any) => {
          console.log(`Mock: Updating file ${id}`, data)
          return { ...mockRecord, ...data, id }
        },
      },
    },
  }
}
