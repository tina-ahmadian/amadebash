import React from 'react';
import { User, Activity, Phone } from 'lucide-react';
import { Responder } from '../data/mockData';

interface RespondersListProps {
  responders: Responder[];
}

const RespondersList: React.FC<RespondersListProps> = ({ responders }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'on_duty':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'فعال';
      case 'on_duty':
        return 'در مأموریت';
      case 'inactive':
        return 'غیرفعال';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
        <User className="w-5 h-5 text-red-600" />
        <h2 className="text-xl font-bold text-gray-800">امدادگران</h2>
      </div>

      <div className="space-y-3">
        {responders.map(responder => (
          <div
            key={responder.id}
            className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-right">{responder.name}</h3>
                <div className="flex items-center gap-2 mt-1 justify-end">
                  <span className="text-sm text-gray-600">
                    {responder.gender === 'male' ? 'مرد' : 'زن'}
                  </span>
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(responder.status)}`}>
                {getStatusText(responder.status)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2 justify-end">
              <span dir="ltr">{responder.phone}</span>
              <Phone className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 justify-end">
              <span dir="ltr">
                {responder.position.lat.toFixed(4)}, {responder.position.lng.toFixed(4)}
              </span>
              <Activity className="w-3 h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RespondersList;
