
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER, BUTTON_PRIMARY_CLASSES, CARD_STYLES } from "@/config/platform-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

type Appointment = {
    id: number;
    scheduledAt: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
    notes?: string;
    customer?: { firstName: string; lastName: string; email: string; phone: string };
    agent?: { firstName: string; lastName: string };
    property?: { title: string; address: string };
};

export default function AppointmentsManager() {
    const { t, dir, language } = useLanguage();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data: appointments, isLoading } = useQuery<Appointment[]>({
        queryKey: ["/api/appointments"],
    });

    // Mock customer/property selection data for creation (in real app, fetch these)
    // For MVP, we will use text inputs or IDs if needed, but text inputs for customer ID might be hard.
    // We will keep creation simple or mocked for now if we don't have easy selectors.
    // Actually we have /api/customers and /api/listings.
    // Let's implement a basic creation form.

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to create appointment");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
            setIsCreateOpen(false);
            toast({ title: t("common.success"), description: "Appointment created successfully" });
        },
        onError: () => {
            toast({ title: t("common.error"), description: "Failed to create appointment", variant: "destructive" });
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const res = await fetch(`/api/appointments/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed to update status");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
            toast({ title: t("common.success"), description: "Status updated" });
        }
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return "bg-blue-100 text-blue-800";
            case 'COMPLETED': return "bg-green-100 text-green-800";
            case 'CANCELLED': return "bg-red-100 text-red-800";
            case 'RESCHEDULED': return "bg-yellow-100 text-yellow-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "PPP p", { locale: language === 'ar' ? ar : enUS });
    };

    return (
        <div className={PAGE_WRAPPER} dir={dir}>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{t("nav.calendar")} & {t("common.appointments") || "Appointments"}</h1>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className={BUTTON_PRIMARY_CLASSES}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t("common.create") || "New Appointment"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Appointment</DialogTitle>
                        </DialogHeader>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                createMutation.mutate({
                                    customerId: formData.get("customerId"), // In real app, use Select
                                    scheduledAt: new Date(formData.get("scheduledAt") as string).toISOString(),
                                    notes: formData.get("notes"),
                                });
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label>Customer (ID for now)</Label>
                                <Input name="customerId" placeholder="Customer ID (UUID)" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Date & Time</Label>
                                <Input type="datetime-local" name="scheduledAt" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea name="notes" placeholder="Meeting details..." />
                            </div>
                            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Creating..." : "Schedule Appointment"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{appointments?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {appointments?.filter(a => new Date(a.scheduledAt) > new Date() && a.status === 'SCHEDULED').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {appointments?.filter(a => a.status === 'COMPLETED').length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className={CARD_STYLES.container}>
                <CardHeader>
                    <CardTitle>Appointments List</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : appointments && appointments.length > 0 ? (
                        <div className="space-y-4">
                            {appointments.map((appointment) => (
                                <div key={appointment.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start space-x-4 rtl:space-x-reverse mb-4 md:mb-0">
                                        <div className="bg-blue-100 p-2 rounded-full">
                                            <CalendarIcon className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {appointment.customer ? `${appointment.customer.firstName} ${appointment.customer.lastName}` : "Unknown Customer"}
                                            </h3>
                                            <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3 rtl:space-x-reverse">
                                                <span className="flex items-center">
                                                    <Clock className="w-3 h-3 mr-1 ml-1" />
                                                    {formatDate(appointment.scheduledAt)}
                                                </span>
                                                {appointment.property && (
                                                    <span className="flex items-center">
                                                        <MapPin className="w-3 h-3 mr-1 ml-1" />
                                                        {appointment.property.title}
                                                    </span>
                                                )}
                                            </div>
                                            {appointment.notes && (
                                                <p className="text-sm text-gray-600 mt-2 max-w-xl">{appointment.notes}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                        <Badge className={`${getStatusColor(appointment.status)} border-0`}>
                                            {appointment.status}
                                        </Badge>

                                        {appointment.status === 'SCHEDULED' && (
                                            <div className="flex space-x-1 rtl:space-x-reverse">
                                                <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: 'COMPLETED' })}
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: 'CANCELLED' })}
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No appointments found.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
