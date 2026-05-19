import { Navigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Bus, MapPin, ShieldCheck, QrCode, CreditCard, Users, MapIcon, CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Index() {
    const { user, loading } = useAuth();
    const [origen, setOrigen] = useState("");
    const [destino, setDestino] = useState("");
    const [fecha, setFecha] = useState("");

    if (!loading && user && (user.role === "administrador" || user.role === "oficinista")) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSearch = () => {
        console.log({ origen, destino, fecha });
    };

    return (
        <>
            {/* SECCIÓN HERO (Persona 4) */}
            <section className="w-full py-16 md:py-24 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                <div className="container">
                    {/* Badge */}
                    <div className="inline-block mb-4 px-4 py-2 rounded-full bg-primary-foreground/20 text-sm font-medium">
                        ✨ Boletos de bus en línea, Ecuador
                    </div>

                    {/* Título h1 */}
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 max-w-2xl">
                        Viaja seguro y rápido por Ecuador
                    </h1>

                    {/* Subtítulo descriptivo */}
                    <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl">
                        Reserva boletos de bus al instante. Pago seguro, asientos garantizados y boleto digital en tu celular.
                    </p>
                </div>
            </section>

            {/* BUSCADOR DE VIAJES (Persona 4) */}
            <section className="container -mt-12 relative z-10 mb-16">
                <Card className="p-6 md:p-8 shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Input Origen */}
                        <div className="space-y-2">
                            <Label htmlFor="origen" className="text-sm font-medium">
                                Origen
                            </Label>
                            <div className="relative">
                                <MapIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="origen"
                                    placeholder="¿De dónde sales?"
                                    value={origen}
                                    onChange={(e) => setOrigen(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Input Destino */}
                        <div className="space-y-2">
                            <Label htmlFor="destino" className="text-sm font-medium">
                                Destino
                            </Label>
                            <div className="relative">
                                <MapIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="destino"
                                    placeholder="¿A dónde vas?"
                                    value={destino}
                                    onChange={(e) => setDestino(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Input Fecha */}
                        <div className="space-y-2">
                            <Label htmlFor="fecha" className="text-sm font-medium">
                                Fecha
                            </Label>
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

                        {/* Botón Buscar */}
                        <div className="flex items-end">
                            <Button
                                onClick={handleSearch}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                size="lg"
                            >
                                Buscar viajes
                            </Button>
                        </div>
                    </div>
                </Card>
            </section>

            {/* SECCIÓN DE BENEFICIOS (Persona 5) */}
            <section className="container py-16 md:py-20">
                <div className="text-center mb-12">
                    {/* Título y subtítulo centrado */}
                    <h2 className="text-3xl md:text-4xl font-bold mb-3">¿Por qué BusEcuador?</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Una experiencia de compra moderna pensada para pasajeros y cooperativas.
                    </p>
                </div>

                {/* Grid de 3 columnas en desktop y 1 en móvil */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: MapPin, title: "Selección visual de asiento", desc: "Elige tu lugar exacto en un mapa interactivo del bus." },
                        { icon: ShieldCheck, title: "Pago seguro con validación", desc: "Sube tu comprobante de transferencia y un oficinista lo valida." },
                        { icon: QrCode, title: "Boleto digital con QR", desc: "Lleva tu boleto en el celular y aborda mostrando el QR." },
                        { icon: CreditCard, title: "Descuentos legales", desc: "Aplicamos automáticamente menores, tercera edad y discapacidad." },
                        { icon: Users, title: "Compra para varios", desc: "Adquiere varios asientos en una sola reserva." },
                        { icon: Bus, title: "Cooperativas verificadas", desc: "Trabajamos con operadoras autorizadas por la ANT." },
                    ].map((beneficio, index) => (
                        <Card key={index} className="p-6 hover:shadow-md transition-shadow border-border/50">
                            {/* Icono con fondo suave y color primary */}
                            <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4">
                                <beneficio.icon className="h-6 w-6" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{beneficio.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {beneficio.desc}
                            </p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* SECCIÓN CTA (Persona 6) */}
            <section className="container pb-20">
                {/* Card con fondo color primary y texto claro */}
                <Card className="p-8 md:p-12 text-center bg-primary text-primary-foreground border-0">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3">
                        ¿Listo para tu próximo viaje?
                    </h2>
                    <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
                        Crea tu cuenta gratis y empieza a reservar boletos en segundos.
                    </p>

                    {/* Botones centrados con sus respectivas variantes y rutas */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button variant="secondary" size="lg" asChild>
                            <Link to="/auth?tab=signup">Crear cuenta</Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                            asChild
                        >
                            <Link to="/buscar">Buscar viajes</Link>
                        </Button>
                    </div>
                </Card>
            </section>
        </>
    );
}