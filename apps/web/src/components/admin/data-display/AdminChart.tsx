import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartData {
    [key: string]: string | number;
}

interface AdminChartProps {
    title?: string;
    description?: string;
    data: ChartData[];
    type: 'line' | 'bar' | 'area' | 'pie';
    dataKeys: string[];
    xAxisKey?: string;
    colors?: string[];
    height?: number;
    showLegend?: boolean;
    showGrid?: boolean;
}

const DEFAULT_COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
];

export function AdminChart({
    title,
    description,
    data,
    type,
    dataKeys,
    xAxisKey = 'name',
    colors = DEFAULT_COLORS,
    height = 300,
    showLegend = true,
    showGrid = true,
}: AdminChartProps) {
    const renderChart = () => {
        switch (type) {
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LineChart data={data}>
                            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                            <XAxis dataKey={xAxisKey} />
                            <YAxis />
                            <Tooltip />
                            {showLegend && <Legend />}
                            {dataKeys.map((key, index) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <BarChart data={data}>
                            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                            <XAxis dataKey={xAxisKey} />
                            <YAxis />
                            <Tooltip />
                            {showLegend && <Legend />}
                            {dataKeys.map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={colors[index % colors.length]}
                                    radius={[4, 4, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <AreaChart data={data}>
                            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                            <XAxis dataKey={xAxisKey} />
                            <YAxis />
                            <Tooltip />
                            {showLegend && <Legend />}
                            {dataKeys.map((key, index) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={colors[index % colors.length]}
                                    fill={colors[index % colors.length]}
                                    fillOpacity={0.6}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey={dataKeys[0]}
                                nameKey={xAxisKey}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            {showLegend && <Legend />}
                        </PieChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    if (title || description) {
        return (
            <Card>
                <CardHeader>
                    {title && <CardTitle>{title}</CardTitle>}
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent>{renderChart()}</CardContent>
            </Card>
        );
    }

    return renderChart();
}

// Convenience components for specific chart types
export function AdminLineChart(props: Omit<AdminChartProps, 'type'>) {
    return <AdminChart {...props} type="line" />;
}

export function AdminBarChart(props: Omit<AdminChartProps, 'type'>) {
    return <AdminChart {...props} type="bar" />;
}

export function AdminAreaChart(props: Omit<AdminChartProps, 'type'>) {
    return <AdminChart {...props} type="area" />;
}

export function AdminPieChart(props: Omit<AdminChartProps, 'type'>) {
    return <AdminChart {...props} type="pie" />;
}
