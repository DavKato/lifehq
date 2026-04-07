"use client";

import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
	name: string;
	defaultValue?: string;
	placeholder?: string;
	onSelect?: (value: string) => void;
};

export function DatePicker({
	name,
	defaultValue,
	placeholder = "Pick a date",
	onSelect,
}: DatePickerProps) {
	const [selected, setSelected] = React.useState<Date | undefined>(
		defaultValue ? parseISO(defaultValue) : undefined,
	);
	const [open, setOpen] = React.useState(false);

	const isoValue = selected ? format(selected, "yyyy-MM-dd") : "";

	return (
		<>
			<input type="hidden" name={name} value={isoValue} />
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="outline"
						className={cn(
							"w-full justify-start text-left font-normal",
							!selected && "text-muted-foreground",
						)}
					>
						<CalendarIcon className="mr-2 size-4" />
						{selected
							? format(selected, "MMM d, yyyy")
							: placeholder}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={selected}
						onSelect={(day) => {
							setSelected(day);
							setOpen(false);
							onSelect?.(day ? format(day, "yyyy-MM-dd") : "");
						}}
						className="[--cell-size:2.5rem]"
						initialFocus
					/>
				</PopoverContent>
			</Popover>
		</>
	);
}
