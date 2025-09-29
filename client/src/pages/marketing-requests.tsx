import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Megaphone, Sparkles, ShieldCheck } from "lucide-react";
import type { MarketingProposal, MarketingRequest, MarketingRequestStatus, MarketingRequestTier } from "@shared/types";
import { useToast } from "@/hooks/use-toast";

interface RequestWithExtras extends MarketingRequest {
  proposals?: MarketingProposal[];
}

const TIER_BADGE: Record<MarketingRequestTier, { label: string; className: string }> = {
  STANDARD: { label: "أساسي", className: "bg-slate-200 text-slate-700" },
  SERIOUS: { label: "جاد", className: "bg-amber-200 text-amber-900" },
  ENTERPRISE: { label: "مؤسسي", className: "bg-indigo-200 text-indigo-900" },
};

const STATUS_LABEL: Record<MarketingRequestStatus, string> = {
  DRAFT: "مسودة",
  PENDING_REVIEW: "بانتظار المراجعة",
  OPEN: "متاح للوسطاء",
  AWARDED: "تم الترسية",
  CLOSED: "مغلق",
  REJECTED: "مرفوض",
};

const statusFilterOptions: { value: "all" | MarketingRequestStatus; label: string }[] = [
  { value: "all", label: "جميع الحالات" },
  { value: "PENDING_REVIEW", label: "بانتظار المراجعة" },
  { value: "OPEN", label: "متاح" },
  { value: "AWARDED", label: "تم الترسية" },
  { value: "CLOSED", label: "مغلق" },
];

const tierFilterOptions: { value: "all" | MarketingRequestTier; label: string }[] = [
  { value: "all", label: "كل الفئات" },
  { value: "STANDARD", label: "أساسي" },
  { value: "SERIOUS", label: "جاد" },
  { value: "ENTERPRISE", label: "مؤسسي" },
];

export default function MarketingRequestsBoardPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | MarketingRequestStatus>("OPEN");
  const [tierFilter, setTierFilter] = useState<"all" | MarketingRequestTier>("all");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RequestWithExtras | null>(null);
  const [proposalMessage, setProposalMessage] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [marketingBudget, setMarketingBudget] = useState("");
  const [estimatedTimeline, setEstimatedTimeline] = useState("");
  const [proposalFeedback, setProposalFeedback] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: requests = [], isLoading, isFetching } = useQuery<RequestWithExtras[]>({
    queryKey: ["marketing-requests", statusFilter, tierFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("includeOwner", "1");
      params.set("includeProposals", "1");
      params.set("scope", "agent");
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (tierFilter !== "all") params.set("seriousnessTier", tierFilter);
      if (search.trim()) params.set("search", search.trim());

      const response = await fetch(`/api/marketing-requests?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load marketing requests");
      }
      return response.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: { requestId: string; message?: string; commissionRate?: number; marketingBudget?: number; estimatedTimeline?: string }) => {
      const { requestId, ...rest } = payload;
      const response = await fetch(`/api/marketing-requests/${requestId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rest),
      });
      if (response.status === 401) {
        throw new Error("يرجى تسجيل الدخول كوسيط لإرسال عرض.");
      }
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.message || "تعذر إرسال العرض");
      }
      return response.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing-requests"] });
      setProposalMessage("");
      setCommissionRate("");
      setMarketingBudget("");
      setEstimatedTimeline("");
      setProposalFeedback("تم إرسال العرض بنجاح وسيصلك إشعار عند الرد.");
      toast({
        title: "تم إرسال العرض",
        description: "تم تسجيل عرضك التسويقي بنجاح.",
      });
    },
    onError: (error: any) => {
      setProposalFeedback(error instanceof Error ? error.message : "تعذر إرسال العرض");
      toast({
        title: "تعذر إرسال العرض",
        description: error instanceof Error ? error.message : "يرجى المحاولة مرة أخرى",
        variant: "destructive" as any,
      });
    }
  });

  const filteredRequests = useMemo(() => {
    return requests
      .filter((request) => {
        if (statusFilter !== "all" && request.status !== statusFilter) return false;
        if (tierFilter !== "all" && request.seriousnessTier !== tierFilter) return false;
        if (search.trim()) {
          const haystack = `${request.title} ${request.summary} ${request.city}`.toLowerCase();
          if (!haystack.includes(search.trim().toLowerCase())) return false;
        }
        return true;
      });
  }, [requests, statusFilter, tierFilter, search]);

  const handleSelectRequest = (request: RequestWithExtras) => {
    setSelectedRequest(request);
    setProposalMessage("");
    setCommissionRate("");
    setMarketingBudget("");
    setEstimatedTimeline("");
  };

  const handleSubmitProposal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRequest) return;
    setProposalFeedback(null);

    mutation.mutate({
      requestId: selectedRequest.id,
      message: proposalMessage.trim() || undefined,
      commissionRate: commissionRate ? Number(commissionRate) : undefined,
      marketingBudget: marketingBudget ? Number(marketingBudget) : undefined,
      estimatedTimeline: estimatedTimeline.trim() || undefined,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <header className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">سوق طلبات التسويق</h1>
            <p className="text-slate-500 text-sm">اطلع على طلبات الملاك وقدّم عرضك التسويقي لإغلاق المزيد من الصفقات.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
          >
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={tierFilter}
            onChange={(event) => setTierFilter(event.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
          >
            {tierFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
            placeholder="ابحث حسب العنوان أو المدينة"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 space-y-4">
          {isLoading || isFetching ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center text-slate-500">
              جاري تحميل الطلبات...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center text-slate-500">
              لا توجد طلبات مطابقة للمرشحات الحالية.
            </div>
          ) : (
            filteredRequests.map((request) => {
              const tierBadge = TIER_BADGE[request.seriousnessTier];

              return (
                <article
                  key={request.id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() => handleSelectRequest(request)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{request.title}</h2>
                      <p className="text-slate-500 text-sm mt-1 line-clamp-2">{request.summary}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-500">
                        <span className="px-2 py-1 bg-slate-100 rounded-full">{request.city}{request.district ? ` • ${request.district}` : ""}</span>
                        {request.propertyType && (
                          <span className="px-2 py-1 bg-slate-100 rounded-full">{request.propertyType}</span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tierBadge.className}`}>
                          {tierBadge.label}
                        </span>
                        <span className="px-2 py-1 bg-slate-100 rounded-full">{STATUS_LABEL[request.status]}</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                      <ShieldCheck className="w-4 h-4" /> {request.proposals?.length || 0} عروض مقدمة
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <aside className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
          {selectedRequest ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-700">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-semibold">تفاصيل الطلب</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="font-semibold text-slate-900">{selectedRequest.title}</div>
                <div className="text-slate-600 leading-relaxed whitespace-pre-line">{selectedRequest.summary}</div>
                {selectedRequest.requirements && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-slate-600 text-sm">
                    <span className="font-medium text-slate-800 block mb-1">تفاصيل إضافية:</span>
                    {selectedRequest.requirements}
                  </div>
                )}
                <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <div>
                    <dt className="font-medium text-slate-700">المدينة</dt>
                    <dd>{selectedRequest.city}</dd>
                  </div>
                  {selectedRequest.listingType && (
                    <div>
                      <dt className="font-medium text-slate-700">نوع العرض</dt>
                      <dd>{selectedRequest.listingType}</dd>
                    </div>
                  )}
                  {selectedRequest.budgetMin && (
                    <div>
                      <dt className="font-medium text-slate-700">الميزانية</dt>
                      <dd>
                        {selectedRequest.budgetMin?.toLocaleString()} - {selectedRequest.budgetMax?.toLocaleString() || "غير محدد"} ر.س
                      </dd>
                    </div>
                  )}
                  {selectedRequest.preferredStartDate && (
                    <div>
                      <dt className="font-medium text-slate-700">بداية الحملة</dt>
                      <dd>{format(new Date(selectedRequest.preferredStartDate), "yyyy/MM/dd")}</dd>
                    </div>
                  )}
                  {selectedRequest.preferredEndDate && (
                    <div>
                      <dt className="font-medium text-slate-700">نهاية الحملة</dt>
                      <dd>{format(new Date(selectedRequest.preferredEndDate), "yyyy/MM/dd")}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <form onSubmit={handleSubmitProposal} className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">قدّم عرضك التسويقي</h4>
                <textarea
                  value={proposalMessage}
                  onChange={(event) => setProposalMessage(event.target.value)}
                  className="w-full min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="اشرح استراتيجيتك التسويقية والقنوات المقترحة"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={commissionRate}
                    onChange={(event) => setCommissionRate(event.target.value)}
                    type="number"
                    min="0"
                    step="0.1"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="نسبة السعي %"
                  />
                  <input
                    value={marketingBudget}
                    onChange={(event) => setMarketingBudget(event.target.value)}
                    type="number"
                    min="0"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="ميزانية التسويق"
                  />
                </div>
                <input
                  value={estimatedTimeline}
                  onChange={(event) => setEstimatedTimeline(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="المدة المتوقعة للتنفيذ"
                />
                {proposalFeedback && (
                  <div
                    className={`text-sm rounded-xl px-3 py-2 border ${
                      mutation.isError
                        ? "text-red-600 bg-red-50 border-red-100"
                        : "text-emerald-700 bg-emerald-50 border-emerald-100"
                    }`}
                  >
                    {proposalFeedback}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {mutation.isPending ? "جاري الإرسال..." : "إرسال العرض"}
                </button>
              </form>
            </div>
          ) : (
            <div className="text-slate-500 text-sm">
              اختر أحد الطلبات من القائمة لمراجعة التفاصيل وتقديم عرضك.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
