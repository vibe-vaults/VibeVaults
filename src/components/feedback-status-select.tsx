'use client';

import * as React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

interface FeedbackStatusSelectProps {
    initialStatus: string;
    /** The write. The dashboard passes the server action, the /demo its sandbox. */
    onStatusChange: (status: string) => Promise<{ error?: string }>;
}

export function FeedbackStatusSelect({ initialStatus, onStatusChange }: FeedbackStatusSelectProps) {
    const [status, setStatus] = React.useState(initialStatus);

    const handleStatusChange = async (newStatus: string) => {
        setStatus(newStatus); // Optimistic update
        try {
            const result = await onStatusChange(newStatus);
            if (result?.error) {
                toast("Error", { description: result.error, icon: <AlertCircle className="h-4 w-4 text-red-500" /> });
                setStatus(initialStatus); // Revert on error
            }
        } catch (error) {
            toast("Error", { description: 'Failed to update status.', icon: <AlertCircle className="h-4 w-4 text-red-500" /> });
            setStatus(initialStatus); // Revert on error
        }
    };

    return (
        <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="in review">In Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
        </Select>
    );
}
