"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { DayPicker, type DayButtonProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-3 [--cell-size:2.5rem] rounded-lg border border-border bg-card",
        className
      )}
      classNames={{
        months: "flex flex-col gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium text-foreground",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-1 size-8 p-0 text-muted-foreground hover:text-foreground"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "absolute right-1 size-8 p-0 text-muted-foreground hover:text-foreground"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal text-foreground hover:bg-accent aria-selected:opacity-100"
        ),
        selected:
          "bg-primary/20 text-primary hover:bg-primary/30 focus:bg-primary/30",
        today: "bg-accent text-primary",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") return <ChevronLeftIcon className="size-4" />
          return <ChevronRightIcon className="size-4" />
        },
        DayButton: CalendarDayButton,
        ...components
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: DayButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      className={cn(
        "size-9 p-0 font-normal text-foreground hover:bg-accent",
        modifiers.selected && "bg-primary/20 text-primary hover:bg-primary/30",
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
