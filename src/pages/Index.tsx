import { Navigate, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { Bus, MapPin, ShieldCheck, QrCode, CreditCard, Users, MapIcon, CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { rutasService } from "@/lib/rutasService";
import type { Ruta } from "@/lib/rutasService";

export default function Index() {
    const { user, loading } = useAuth();
    const { t } = useLang();
    const navigate = useNavigate();
    const [origen, setOrigen] = useState("");
    const [destino, setDestino] = useState("");
    const [fecha, setFecha] = useState("");
    const [sugerenciasOrigen, setSugerenciasOrigen] = useState<string[]>([]);
    const [sugerenciasDestino, setSugerenciasDestino] = useState<string[]>([]);
    const [rutas, setRutas] = useState<Ruta[]>([]);
    const [loadingRutas, setLoadingRutas] = useState(true);

    useEffect(() => {
        const fetchRutas = async () => {
            try {
                const data = await rutasService.getAll();
                setRutas(data);
            } catch (error) {
                console.error("Error al cargar rutas", error);
            } finally {
                setLoadingRutas(false);
            }
        };
        fetchRutas();
    }, []);

    const origenesUnicos = Array.from(new Set(rutas.map(r => r.ciudad_origen))).sort();
    const destinosUnicos = Array.from(new Set(rutas.map(r => r.ciudad_destino))).sort();

    if (!loading && user) {
        if (user.role === "administrador" || user.role === "oficinista") {
            return <Navigate to="/dashboard" replace />;
        }
        if (user.role === "chofer") {
            return <Navigate to="/chofer" replace />;
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!origen || !destino || !fecha) {
            alert(t("hero_search_required"));
            return;
        }
        const params = new URLSearchParams({ origen, destino, fecha });
        navigate(`/buscar?${params.toString()}`);
    };

    const benefits = [
        { icon: MapPin,      title: t("benefit_seat_title"),     desc: t("benefit_seat_desc") },
        { icon: ShieldCheck, title: t("benefit_pay_title"),      desc: t("benefit_pay_desc") },
        { icon: QrCode,      title: t("benefit_qr_title"),       desc: t("benefit_qr_desc") },
        { icon: CreditCard,  title: t("benefit_discount_title"), desc: t("benefit_discount_desc") },
        { icon: Users,       title: t("benefit_multi_title"),    desc: t("benefit_multi_desc") },
        { icon: Bus,         title: t("benefit_coop_title"),     desc: t("benefit_coop_desc") },
    ];

    return (
        <>
            {/* HERO */}
            <section className="w-full py-16 md:py-24 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                <div className="container">
                    <div className="inline-block mb-4 px-4 py-2 rounded-full bg-primary-foreground/20 text-sm font-medium">
                        {t("hero_badge")}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 max-w-2xl">
                        {t("hero_title")}
                    </h1>
                    <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl">
                        {t("hero_subtitle")}
                    </p>
                </div>
            </section>

            {/* BUSCADOR */}
            <section className="container -mt-12 relative z-10 mb-16">
                <Card className="p-6 md:p-8 shadow-lg">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="origen" className="text-sm font-medium">{t("search_origin")}</Label>
                            <div className="relative">
                                <MapIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="origen"
                                    placeholder={loadingRutas ? "Cargando..." : (origenesUnicos.length === 0 ? "No disponible" : t("search_origin_placeholder"))}
                                    value={origen}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setOrigen(val);
                                        setSugerenciasOrigen(
                                            val.length > 0
                                                ? origenesUnicos.filter((c) => c.toLowerCase().startsWith(val.toLowerCase()))
                                                : []
                                        );
                                    }}
                                    onBlur={() => setTimeout(() => setSugerenciasOrigen([]), 150)}
                                    autoComplete="off"
                                    className="pl-10"
                                    disabled={loadingRutas || origenesUnicos.length === 0}
                                />
                                {sugerenciasOrigen.length > 0 && (
                                    <ul className="absolute z-50 w-full bg-popover text-popover-foreground border border-border rounded-md shadow-md mt-1 max-h-48 overflow-y-auto">
                                        {sugerenciasOrigen.map((c) => (
                                            <li
                                                key={c}
                                                className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                                onMouseDown={() => { setOrigen(c); setSugerenciasOrigen([]); }}
                                            >
                                                {c}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="destino" className="text-sm font-medium">{t("search_destination")}</Label>
                            <div className="relative">
                                <MapIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="destino"
                                    placeholder={loadingRutas ? "Cargando..." : (destinosUnicos.length === 0 ? "No disponible" : t("search_destination_placeholder"))}
                                    value={destino}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setDestino(val);
                                        setSugerenciasDestino(
                                            val.length > 0
                                                ? destinosUnicos.filter((c) => c.toLowerCase().startsWith(val.toLowerCase()))
                                                : []
                                        );
                                    }}
                                    onBlur={() => setTimeout(() => setSugerenciasDestino([]), 150)}
                                    autoComplete="off"
                                    className="pl-10"
                                    disabled={loadingRutas || destinosUnicos.length === 0}
                                />
                                {sugerenciasDestino.length > 0 && (
                                    <ul className="absolute z-50 w-full bg-popover text-popover-foreground border border-border rounded-md shadow-md mt-1 max-h-48 overflow-y-auto">
                                        {sugerenciasDestino.map((c) => (
                                            <li
                                                key={c}
                                                className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                                onMouseDown={() => { setDestino(c); setSugerenciasDestino([]); }}
                                            >
                                                {c}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fecha" className="text-sm font-medium">{t("search_date")}</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="fecha"
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    min={new Date().toISOString().split("T")[0]}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
                                {t("search_btn")}
                            </Button>
                        </div>
                    </form>
                </Card>
            </section>

            {/* BENEFICIOS */}
            <section className="container py-16 md:py-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("benefits_title")}</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">{t("benefits_subtitle")}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {benefits.map((b, i) => (
                        <Card key={i} className="p-6 hover:shadow-md transition-shadow border-border/50">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4">
                                <b.icon className="h-6 w-6" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="container pb-20">
                <Card className="p-8 md:p-12 text-center bg-primary text-primary-foreground border-0">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3">{t("cta_title")}</h2>
                    <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">{t("cta_subtitle")}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button variant="secondary" size="lg" asChild>
                            <Link to="/auth?tab=signup">{t("cta_signup")}</Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                            asChild
                        >
                            <Link to="/buscar">{t("cta_search")}</Link>
                        </Button>
                    </div>
                </Card>
            </section>
        </>
    );
}
