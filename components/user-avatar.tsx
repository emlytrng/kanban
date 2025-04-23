import type { User } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserAvatarProps {
  user: User
  size?: "sm" | "md" | "lg"
}

export default function UserAvatar({ user, size = "md" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }

  const initialsClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
      <AvatarFallback className={initialsClasses[size]}>{getInitials(user.name)}</AvatarFallback>
    </Avatar>
  )
}
