import Link from "next/link"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  variant?: "default" | "white" | "compact"
  showTagline?: boolean
  href?: string
}

export function Logo({ size = "md", variant = "default", showTagline = true, href = "/" }: LogoProps) {
  const sizeClasses = {
    sm: {
      icon: "h-8 w-8",
      text: "text-lg",
      tagline: "text-xs",
    },
    md: {
      icon: "h-10 w-10",
      text: "text-xl",
      tagline: "text-xs",
    },
    lg: {
      icon: "h-12 w-12",
      text: "text-2xl",
      tagline: "text-sm",
    },
  }

  const variantClasses = {
    default: {
      text: "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent",
      tagline: "text-gray-500",
    },
    white: {
      text: "text-white",
      tagline: "text-gray-300",
    },
    compact: {
      text: "text-gray-900",
      tagline: "text-gray-600",
    },
  }

  const LogoContent = () => (
    <div className="flex items-center gap-3">
      <div
        className={`${sizeClasses[size].icon} rounded-xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg relative overflow-hidden`}
      >
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
        <span className={`text-white font-bold ${sizeClasses[size].text} relative z-10`}>F</span>
      </div>
      <div className="flex flex-col">
        <span className={`font-bold ${sizeClasses[size].text} ${variantClasses[variant].text}`}>FlashMind</span>
        {showTagline && (
          <span className={`${sizeClasses[size].tagline} ${variantClasses[variant].tagline} -mt-1`}>
            AI Learning Platform
          </span>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity duration-200">
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}
