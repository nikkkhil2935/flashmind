"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Home, Upload, BookOpen, Brain, BarChart3, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

const menuItems = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Upload",
    url: "/dashboard/upload",
    icon: Upload,
  },
  {
    title: "My Flashcards",
    url: "/dashboard/flashcards",
    icon: BookOpen,
  },
  {
    title: "Quiz Mode",
    url: "/dashboard/quiz",
    icon: Brain,
  },
  {
    title: "Progress",
    url: "/dashboard/progress",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-3 px-2 py-3 hover:opacity-80 transition-opacity">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              FlashMind
            </span>
            <span className="text-xs text-gray-500 -mt-1">AI Learning</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">john@example.com</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
