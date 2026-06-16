import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, Loader2, Image as ImageIcon, Settings2, MapPin, Activity, FileSpreadsheet } from "lucide-react";

const PipingForm = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États du formulaire avec des standards industriels
  const [formData, setFormData] = useState({
    lineId: "",           // Tag de la ligne (ex: LIG-EAU-01)
    zone: "",             // Secteur d'installation
    fluidType: "",        // Eau brute, Eau traitée, etc.
    material: "",         // PEHD, Fonte, Acier...
    dn: "",               // Diamètre Nominal (mm)
    pn: "",               // Pression Nominale (bar)
    length: "",           // Longueur du tronçon (m)
    installationDate: "", // Date de pose
    status: "active"      // État de la ligne
  });
  
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");

  // --- FONCTION D'EXPORT EXCEL (CSV) ---
  const exportToExcel = (data: typeof formData) => {
    // 1. Définir les en-têtes des colonnes Excel
    const headers = ["Tag Ligne", "Zone", "Type de Fluide", "Matériau", "DN (mm)", "PN (bar)", "Longueur (m)", "Date de pose", "Statut"];
    
    // 2. Récupérer les valeurs correspondantes
    const values = [
      data.lineId, 
      data.zone, 
      data.fluidType, 
      data.material, 
      data.dn, 
      data.pn, 
      data.length, 
      data.installationDate, 
      data.status
    ];

    // 3. Formater en CSV (utilisation du point-virgule pour Excel en français)
    const csvContent = [
      headers.join(";"),
      values.map(v => `"${v}"`).join(";")
    ].join("\n");

    // 4. Créer le fichier avec l'encodage UTF-8 (BOM) pour gérer les accents (é, à, etc.)
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // 5. Simuler un clic pour télécharger le fichier
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `actif_hydraulique_${data.lineId || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    
    // 6. Nettoyage
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérification basique
    if (!formData.lineId) {
      toast({
        variant: "destructive",
        title: "Information manquante",
        description: "Veuillez renseigner au minimum le Tag de la ligne.",
      });
      return;
    }

    // Déclenchement de l'export Excel
    exportToExcel(formData);

    toast({
      title: "Actif enregistré et exporté",
      description: `La ligne ${formData.lineId} a été sauvegardée dans un fichier Excel.`,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);

    // Simulation d'extraction OCR/IA d'une plaque signalétique ou d'un plan PID
    setTimeout(() => {
      setFormData({
        lineId: "TRN-SFI-204",
        zone: "Secteur Principal - Pompage",
        fluidType: "eau_brute",
        material: "pehd",
        dn: "400",
        pn: "16",
        length: "1250",
        installationDate: "2024-11-15",
        status: "active"
      });
      
      setIsScanning(false);
      setActiveTab("manual");
      
      toast({
        title: "Analyse PID / Plaque terminée",
        description: "Caractéristiques techniques extraites. Veuillez valider les spécifications pour exporter.",
      });
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 2500);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-sm">
      <CardHeader className="bg-muted/30 border-b">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <CardTitle>Gestion des Actifs Hydrauliques</CardTitle>
        </div>
        <CardDescription>
          Référencement technique des conduites pour l'optimisation des flux et la réduction des pertes.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="manual">Saisie Manuelle</TabsTrigger>
            <TabsTrigger value="scan">Smart Scan (Plaque/Plan)</TabsTrigger>
          </TabsList>

          {/* ONGLET : SMART SCAN */}
          <TabsContent value="scan" className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-xl p-16 text-center hover:bg-muted/20 transition-colors bg-slate-50/50">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              
              {isScanning ? (
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping"></div>
                    <Loader2 className="h-12 w-12 text-primary animate-spin relative z-10" />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-base font-semibold text-foreground">Analyse IA en cours...</p>
                    <p className="text-sm text-muted-foreground">Extraction des spécifications nominales</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-5 bg-primary/10 rounded-2xl shadow-inner">
                    <ImageIcon className="h-10 w-10 text-primary" />
                  </div>
                  <div className="max-w-sm space-y-1">
                    <p className="text-base font-semibold">Téléverser un document technique</p>
                    <p className="text-sm text-muted-foreground">Scannez une plaque signalétique, un schéma P&ID ou un marquage sur tuyau.</p>
                  </div>
                  <Button onClick={() => fileInputRef.current?.click()} className="mt-4">
                    <Upload className="mr-2 h-4 w-4" /> Parcourir les fichiers
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ONGLET : SAISIE MANUELLE */}
          <TabsContent value="manual">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Section 1: Identification */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
                  <MapPin className="h-4 w-4" />
                  <span>Identification & Localisation</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lineId">Tag de la Ligne (Code actif)</Label>
                    <Input 
                      id="lineId" 
                      placeholder="ex: TRN-EAU-105" 
                      value={formData.lineId}
                      onChange={(e) => setFormData({...formData, lineId: e.target.value})}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zone">Zone / Sous-système</Label>
                    <Input 
                      id="zone" 
                      placeholder="ex: Station de reprise Nord" 
                      value={formData.zone}
                      onChange={(e) => setFormData({...formData, zone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section 2: Spécifications Techniques */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
                  <Settings2 className="h-4 w-4" />
                  <span>Spécifications Techniques</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Type de Fluide</Label>
                    <Select value={formData.fluidType} onValueChange={(val) => setFormData({...formData, fluidType: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eau_brute">Eau Brute</SelectItem>
                        <SelectItem value="eau_traitee">Eau Traitée / Potable</SelectItem>
                        <SelectItem value="eau_irrig">Eau d'irrigation</SelectItem>
                        <SelectItem value="effluents">Effluents industriels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Matériau de la conduite</Label>
                    <Select value={formData.material} onValueChange={(val) => setFormData({...formData, material: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pehd">PEHD (Polyéthylène)</SelectItem>
                        <SelectItem value="fonte">Fonte Ductile</SelectItem>
                        <SelectItem value="acier_galva">Acier Galvanisé</SelectItem>
                        <SelectItem value="pvc_u">PVC-U Pression</SelectItem>
                        <SelectItem value="prv">PRV (Fibre de verre)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dn">Diamètre Nominal (DN - mm)</Label>
                    <Input 
                      id="dn" 
                      type="number" 
                      placeholder="ex: 150" 
                      value={formData.dn}
                      onChange={(e) => setFormData({...formData, dn: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pn">Pression Nominale (PN - bar)</Label>
                    <Input 
                      id="pn" 
                      type="number" 
                      placeholder="ex: 16" 
                      value={formData.pn}
                      onChange={(e) => setFormData({...formData, pn: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="length">Longueur du tronçon (m)</Label>
                    <Input 
                      id="length" 
                      type="number" 
                      placeholder="ex: 1500" 
                      value={formData.length}
                      onChange={(e) => setFormData({...formData, length: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section 3: Statut Opérationnel */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
                  <Activity className="h-4 w-4" />
                  <span>Statut & Maintenance</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date de mise en service</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={formData.installationDate}
                      onChange={(e) => setFormData({...formData, installationDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>État de l'actif</Label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">En Service (Normal)</SelectItem>
                        <SelectItem value="maintenance">En Maintenance</SelectItem>
                        <SelectItem value="stopped">À l'arrêt / Isolé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4 gap-3">
                <Button type="submit" size="lg" className="w-full md:w-auto px-8 bg-green-600 hover:bg-green-700 text-white">
                  <FileSpreadsheet className="mr-2 h-5 w-5" /> 
                  Enregistrer & Exporter vers Excel
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PipingForm;