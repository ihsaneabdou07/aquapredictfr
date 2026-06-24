import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, Loader2, Image as ImageIcon, Settings2, MapPin, Activity, FileSpreadsheet, Ruler, Gauge, Layers, Cpu } from "lucide-react";
import DigitalTwinViewer from "./DigitalTwinViewer";
import { CheckCircle } from "lucide-react"; // N'oublie pas d'importer cette icône si ce n'est pas fait

const PipingForm = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États du formulaire enrichis pour le contexte de détection de fuites
  const [formData, setFormData] = useState({
    lineId: "",           
    zone: "",             
    installationType: "enterre", // Nouveau: Crucial pour la recherche de pertes
    fluidType: "",        
    material: "",         
    dn: "",               
    pn: "",               
    length: "",           
    hasSensor: "non",     // Nouveau: Indique la présence d'un nœud IoT
    installationDate: "", 
    status: "active"      
  });
  
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");

  const exportToExcel = (data: typeof formData) => {
    const headers = ["Tag Ligne", "Zone", "Pose", "Fluide", "Matériau", "DN (mm)", "PN (bar)", "Longueur (m)", "Capteur IoT", "Date Pose", "Statut"];
    const values = [
      data.lineId, data.zone, data.installationType, data.fluidType, data.material, 
      data.dn, data.pn, data.length, data.hasSensor, data.installationDate, data.status
    ];

    const csvContent = [
      headers.join(";"),
      values.map(v => `"${v}"`).join(";")
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `actif_hydraulique_${data.lineId || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.lineId || !formData.dn || !formData.length) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez renseigner au minimum le Tag, le Diamètre et la Longueur.",
      });
      return;
    }

    exportToExcel(formData);
    toast({
      title: "Actif enregistré",
      description: `La ligne ${formData.lineId} a été sauvegardée avec succès.`,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setTimeout(() => {
      setFormData({
        ...formData,
        lineId: "TRN-SFI-204",
        zone: "Secteur Principal",
        fluidType: "eau_brute",
        material: "pehd",
        dn: "400",
        pn: "16",
        length: "1250",
      });
      setIsScanning(false);
      setActiveTab("manual");
      toast({
        title: "Analyse terminée",
        description: "Spécifications extraites. Veuillez valider.",
      });
    }, 2500);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-sm border-slate-200">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-xl text-slate-800">Référencement du Réseau</CardTitle>
        </div>
        <CardDescription>
          Saisie des paramètres physiques des conduites pour le calibrage des modèles de détection de pertes.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 p-1 bg-slate-100">
            <TabsTrigger value="manual" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Saisie Manuelle</TabsTrigger>
            <TabsTrigger value="scan" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Smart Scan IA</TabsTrigger>
          </TabsList>

          {/* ... (ONGLET SCAN INCHANGÉ) ... */}
          <TabsContent value="scan" className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-16 text-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              {isScanning ? (
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                  <p className="font-medium text-slate-700">Extraction des données en cours...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-4 bg-blue-50 rounded-full text-blue-600">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-slate-700">Cliquez pour scanner un P&ID ou une plaque</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ONGLET : SAISIE MANUELLE AMÉLIORÉ */}
          <TabsContent value="manual">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Bloc 1 : Localisation & Identification */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <MapPin className="h-5 w-5 text-slate-500" />
                  <h3 className="font-semibold text-slate-700">Identification & Topologie</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="lineId" className="flex justify-between">
                      <span>Tag de la Ligne <span className="text-red-500">*</span></span>
                    </Label>
                    <Input 
                      id="lineId" 
                      placeholder="ex: LIG-NORD-01" 
                      value={formData.lineId}
                      onChange={(e) => setFormData({...formData, lineId: e.target.value})}
                      className="font-mono bg-white uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zone">Secteur / Zone</Label>
                    <Input 
                      id="zone" 
                      placeholder="ex: Station de reprise" 
                      value={formData.zone}
                      onChange={(e) => setFormData({...formData, zone: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type de pose</Label>
                    <Select value={formData.installationType} onValueChange={(val) => setFormData({...formData, installationType: val})}>
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enterre">Souterrain (Enterré)</SelectItem>
                        <SelectItem value="aerien">Aérien / Apparent</SelectItem>
                        <SelectItem value="caniveau">En caniveau</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Bloc 2 : Paramètres Hydrauliques */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <Layers className="h-5 w-5 text-slate-500" />
                  <h3 className="font-semibold text-slate-700">Propriétés Physiques</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Matériau</Label>
                    <Select value={formData.material} onValueChange={(val) => setFormData({...formData, material: val})}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Choisir le matériau..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pehd">PEHD (Polyéthylène Haute Densité)</SelectItem>
                        <SelectItem value="fonte">Fonte Ductile</SelectItem>
                        <SelectItem value="pvc">PVC Pression</SelectItem>
                        <SelectItem value="acier">Acier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Type de Fluide</Label>
                    <Select value={formData.fluidType} onValueChange={(val) => setFormData({...formData, fluidType: val})}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Nature de l'eau..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eau_potable">Eau Potable</SelectItem>
                        <SelectItem value="eau_brute">Eau Brute</SelectItem>
                        <SelectItem value="eau_usee">Eaux Usées / Rejets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Inputs avec indicateurs d'unités intégrés */}
                  <div className="space-y-2">
                    <Label htmlFor="dn" className="flex justify-between">
                      <span>Diamètre <span className="text-red-500">*</span></span>
                    </Label>
                    <div className="relative">
                      <Ruler className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input 
                        id="dn" type="number" placeholder="100" 
                        value={formData.dn} onChange={(e) => setFormData({...formData, dn: e.target.value})}
                        className="pl-9 pr-12 bg-white"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-medium">mm</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pn">Pression Nominale</Label>
                    <div className="relative">
                      <Gauge className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input 
                        id="pn" type="number" placeholder="16" 
                        value={formData.pn} onChange={(e) => setFormData({...formData, pn: e.target.value})}
                        className="pl-9 pr-12 bg-white"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-medium">bar</span>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="length" className="flex justify-between">
                      <span>Longueur du tronçon <span className="text-red-500">*</span></span>
                    </Label>
                    <div className="relative">
                      <Input 
                        id="length" type="number" placeholder="Distance estimée" 
                        value={formData.length} onChange={(e) => setFormData({...formData, length: e.target.value})}
                        className="pr-12 bg-white"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-medium">mètres</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloc 3 : Statut & Instrumentation IoT */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <Activity className="h-5 w-5 text-slate-500" />
                  <h3 className="font-semibold text-slate-700">Exploitation & IoT</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>État de l'infrastructure</Label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">En Service</SelectItem>
                        <SelectItem value="maintenance">En Maintenance</SelectItem>
                        <SelectItem value="isole">Isolé / Condamné</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-blue-500" />
                      Instrumentation (Nœud IoT)
                    </Label>
                    <Select value={formData.hasSensor} onValueChange={(val) => setFormData({...formData, hasSensor: val})}>
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non">Aucun capteur</SelectItem>
                        <SelectItem value="debitmetre">Débitmètre connecté</SelectItem>
                        <SelectItem value="pression">Capteur de pression</SelectItem>
                        <SelectItem value="hybride">Mixte (Débit + Pression)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date de pose (approx.)</Label>
                    <Input 
                      id="date" type="date" 
                      value={formData.installationDate} onChange={(e) => setFormData({...formData, installationDate: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <Button type="submit" size="lg" className="w-full md:w-auto px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                  <Save className="mr-2 h-5 w-5" /> 
                  Enregistrer ce tronçon
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