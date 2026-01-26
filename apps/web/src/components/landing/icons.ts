import { ComponentType } from "react";
import {
    Building, Users, TrendingUp, Shield, BarChart3, MessageSquare, Phone, Mail,
    MapPin, Camera, FileText, DollarSign, GitBranch, CheckCircle, CircleCheckBig,
    UserPlus, Eye, NotebookPen, Sparkles, Clock, Headset, Target
} from "lucide-react";

export const ICON_COMPONENTS: Record<string, ComponentType<{ className?: string }>> = {
    users: Users,
    building: Building,
    "trending-up": TrendingUp,
    "bar-chart": BarChart3,
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
    email: Mail,
    mail: Mail,
    "map-pin": MapPin,
    location: MapPin,
    support: Headset,
    headset: Headset,
    clock: Clock,
    sparkles: Sparkles,
    target: Target,
};

export const getIcon = (name: string | undefined): ComponentType<{ className?: string }> | null => {
    if (!name) return null;
    return ICON_COMPONENTS[name.toLowerCase()] || Sparkles;
};
