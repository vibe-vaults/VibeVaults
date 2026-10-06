'use client';

/**
 * Main Responsibility: Account-page switch that shows or hides the
 * "Getting Started" checklist on /dashboard. The way back after a user
 * dismissed it ("I'll explore on my own") or finished every step.
 *
 * Sensitive Dependencies:
 * - setOnboardingVisibleAction: writes `profiles.has_onboarded`, the single
 *   switch the dashboard gate reads. Saves on toggle (no Save button) and
 *   reverts the switch if the write fails.
 * - The `#onboarding` anchor is linked from the checklist and its dismiss
 *   toast (ONBOARDING_TOGGLE_HREF in onboarding.tsx). Keep it stable.
 */
import { useState } from 'react';
import { setOnboardingVisibleAction } from '@/actions/onboarding';
import { reportClientError } from '@/lib/client-error-logging';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Check, ListChecks, Loader2 } from 'lucide-react';

export function OnboardingVisibilityCard({ initialVisible }: { initialVisible: boolean }) {
    const [visible, setVisible] = useState(initialVisible);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleChange = async (next: boolean) => {
        setVisible(next);
        setSaving(true);
        setSaved(false);
        try {
            await setOnboardingVisibleAction(next);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            setVisible(!next);
            const message = reportClientError(error, 'onboarding-visibility-toggle', { next });
            alert(`Failed to save: ${message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="shadow-sm border-gray-200">
            <CardHeader>
                <CardTitle className="font-semibold text-gray-900 flex items-center gap-2">
                    <ListChecks className="w-5 h-5" />
                    Getting Started
                </CardTitle>
                <CardDescription>
                    The setup checklist on your dashboard. Your progress is kept for each workspace, so hiding it loses nothing.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="show-onboarding" className="text-base">Show checklist on dashboard</Label>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 min-h-5">
                            {saving ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                            ) : saved ? (
                                <><Check className="h-3.5 w-3.5 text-green-600" /> Saved</>
                            ) : visible ? (
                                'Visible on the Overview page of every workspace you belong to.'
                            ) : (
                                'Hidden. Turn it on to pick up where you left off.'
                            )}
                        </p>
                    </div>
                    <Switch
                        id="show-onboarding"
                        checked={visible}
                        disabled={saving}
                        onCheckedChange={handleChange}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
