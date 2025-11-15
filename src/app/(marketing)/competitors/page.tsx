'use client';

import { useEffect, useState } from 'react';
import { Check, X, Star, Clock, AlertTriangle } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  description: string;
  pricing: {
    starter: string;
    professional: string;
    enterprise: string;
  };
  features: {
    whatsappIntegration: boolean;
    aiPowered: boolean;
    analytics: boolean;
    multiChannel: boolean;
    automation: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    support247: boolean;
  };
  rating: number;
  setupTime: string;
  limitations: string[];
}

interface ApiResponse {
  success: boolean;
  data?: Competitor[];
  error?: string;
  message?: string;
}

const featureLabels: Record<keyof Competitor['features'], string> = {
  whatsappIntegration: 'Integración WhatsApp',
  aiPowered: 'IA Integrada',
  analytics: 'Analytics Avanzados',
  multiChannel: 'Multi-canal',
  automation: 'Automatización',
  customBranding: 'Marca Personalizada',
  apiAccess: 'Acceso API',
  support247: 'Soporte 24/7',
};

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompetitors() {
      try {
        const response = await fetch('/api/competitors');
        const data: ApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load competitors');
        }

        if (data.success && data.data) {
          setCompetitors(data.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load competitors');
        console.error('Error loading competitors:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCompetitors();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando comparación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const neptunik = competitors.find((c) => c.id === 'neptunik');
  const otherCompetitors = competitors.filter((c) => c.id !== 'neptunik');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Compara Neptunik con la Competencia
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre por qué Neptunik es la mejor opción para tu negocio
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <th className="px-6 py-4 text-left text-white font-semibold">Característica</th>
                  {competitors.map((competitor) => (
                    <th
                      key={competitor.id}
                      className={`px-6 py-4 text-center text-white font-semibold ${
                        competitor.id === 'neptunik' ? 'bg-blue-700' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-lg">{competitor.name}</span>
                        {competitor.id === 'neptunik' && (
                          <span className="text-xs bg-yellow-400 text-blue-900 px-2 py-1 rounded-full mt-1">
                            Recomendado
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Description */}
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Descripción</td>
                  {competitors.map((competitor) => (
                    <td
                      key={competitor.id}
                      className={`px-6 py-4 text-center text-sm ${
                        competitor.id === 'neptunik' ? 'bg-blue-50' : ''
                      }`}
                    >
                      {competitor.description}
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr className="border-b border-gray-200">
                  <td className="px-6 py-4 font-medium text-gray-900">Calificación</td>
                  {competitors.map((competitor) => (
                    <td
                      key={competitor.id}
                      className={`px-6 py-4 text-center ${
                        competitor.id === 'neptunik' ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                        <span className="font-semibold">{competitor.rating}</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Setup Time */}
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-gray-600" />
                      Tiempo de Configuración
                    </div>
                  </td>
                  {competitors.map((competitor) => (
                    <td
                      key={competitor.id}
                      className={`px-6 py-4 text-center font-medium ${
                        competitor.id === 'neptunik' ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      {competitor.setupTime}
                    </td>
                  ))}
                </tr>

                {/* Features */}
                {Object.entries(featureLabels).map(([key, label], index) => (
                  <tr
                    key={key}
                    className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : ''}`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{label}</td>
                    {competitors.map((competitor) => (
                      <td
                        key={competitor.id}
                        className={`px-6 py-4 text-center ${
                          competitor.id === 'neptunik' ? 'bg-blue-50' : ''
                        }`}
                      >
                        {competitor.features[key as keyof Competitor['features']] ? (
                          <Check className="w-6 h-6 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-red-400 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Pricing */}
                <tr className="border-b border-gray-200 bg-blue-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Plan Starter</td>
                  {competitors.map((competitor) => (
                    <td
                      key={competitor.id}
                      className={`px-6 py-4 text-center font-semibold ${
                        competitor.id === 'neptunik' ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                    >
                      {competitor.pricing.starter}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-6 py-4 font-medium text-gray-900">Plan Professional</td>
                  {competitors.map((competitor) => (
                    <td
                      key={competitor.id}
                      className={`px-6 py-4 text-center font-semibold ${
                        competitor.id === 'neptunik' ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      {competitor.pricing.professional}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">Plan Enterprise</td>
                  {competitors.map((competitor) => (
                    <td
                      key={competitor.id}
                      className={`px-6 py-4 text-center font-semibold ${
                        competitor.id === 'neptunik' ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      {competitor.pricing.enterprise}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Limitations Section */}
        {otherCompetitors.some((c) => c.limitations.length > 0) && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {otherCompetitors.map((competitor) => (
              <div key={competitor.id} className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Limitaciones de {competitor.name}
                </h3>
                <ul className="space-y-2">
                  {competitor.limitations.map((limitation, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600">
                      <X className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Listo para empezar con la mejor opción?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Únete a cientos de empresas que ya confían en Neptunik para su comunicación con
            clientes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Comenzar Gratis
            </a>
            <a
              href="/"
              className="inline-block px-8 py-4 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors"
            >
              Ver Demo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
