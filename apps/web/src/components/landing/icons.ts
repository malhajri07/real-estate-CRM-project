import { ComponentType } from "react";
import {
    Building, Building2, Users, TrendingUp, Shield, BarChart, BarChart3, MessageSquare, Phone, Mail,
    MapPin, Camera, FileText, DollarSign, GitBranch, CheckCircle, CircleCheckBig,
    UserPlus, Eye, NotebookPen, Sparkles, Clock, Headset, Target, Smartphone
} from "lucide-react";

export const ICON_COMPONENTS: Record<string, ComponentType<{ className?: string }>> = {
    users: Users,
    building: Building,
    building2: Building2,
    "trending-up": TrendingUp,
    "bar-chart": BarChart3,
    "barchart": BarChart3,
    barChart: BarChart3,
    BarChart: BarChart3,
    "message-square": MessageSquare,
    shield: Shield,
    camera: Camera,
    "file-text": FileText,
    "dollar-sign": DollarSign,
    "git-branch": GitBranch,
    "check-circle": CheckCircle,
    "circle-check-big": CircleCheckBig,
    "user-plus": UserPlus,
    eye: Eye,
    "notebook-pen": NotebookPen,
    phone: Phone,
    Phone: Phone,
    email: Mail,
    mail: Mail,
    Mail: Mail,
    "map-pin": MapPin,
    MapPin: MapPin,
    location: MapPin,
    support: Headset,
    headset: Headset,
    Headset: Headset,
    clock: Clock,
    sparkles: Sparkles,
    Sparkles: Sparkles,
    target: Target,
    Target: Target,
    smartphone: Smartphone,
    Smartphone: Smartphone,
};

export const getIcon = (name: string | undefined): ComponentType<{ className?: string }> | null => {
    if (!name) return null;
    return ICON_COMPONENTS[name.toLowerCase()] || Sparkles;
};
