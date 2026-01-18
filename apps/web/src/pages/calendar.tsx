
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";

export default function Calendar() {
    const { t, dir } = useLanguage();

    return (
        <div className={PAGE_WRAPPER} dir={dir}>
            <section className="ui-section">
                <header className="ui-section__header">
                    <h2 className="text-lg font-semibold text-foreground">
                        {t("nav.calendar")}
                    </h2>
                </header>

                <div className="ui-section__body">
                    <div className="ui-surface p-8 text-center text-muted-foreground">
                        <p>Calendar view coming soon...</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
