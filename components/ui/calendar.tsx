"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { DayPicker, getDefaultClassNames, type DayButtonProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "w-full p-3 [--cell-size:2.5rem] rounded-lg border border-border bg-card",
        className
      )}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: cn("flex w-full flex-col", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        month_caption: cn(
          "flex justify-center pt-1 relative items-center w-full",
          defaultClassNames.month_caption
        ),
        caption_label: cn("text-sm font-medium text-foreground", defaultClassNames.caption_label),
        nav: cn("flex items-center gap-1", defaultClassNames.nav),
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-1 size-8 p-0 text-muted-foreground hover:text-foreground",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "absolute right-1 size-8 p-0 text-muted-foreground hover:text-foreground",
          defaultClassNames.button_next
        ),
        month_grid: cn("w-full border-collapse table-fixed", defaultClassNames.month_grid),
        weekdays: defaultClassNames.weekdays,
        weekday: cn(
          "text-muted-foreground font-normal text-[0.8rem] select-none text-center pb-2",
          defaultClassNames.weekday
        ),
        weeks: defaultClassNames.weeks,
        week: defaultClassNames.week,
        day: cn(
          "relative p-0 text-center align-middle text-sm focus-within:relative focus-within:z-20",
          defaultClassNames.day
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "mx-auto size-(--cell-size) p-0 font-normal text-foreground hover:bg-accent aria-selected:opacity-100",
          defaultClassNames.day_button
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
      data-day={day.date.toLocaleDateString()}
      className={cn(
        "mx-auto size-(--cell-size) p-0 font-normal text-foreground hover:bg-accent",
        modifiers.selected && "bg-primary/20 text-primary hover:bg-primary/30",
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
