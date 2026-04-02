import { ChevronDown, ChevronLeft } from "lucide-react";

const vehicles = [
  {
    id: 1,
    name: "Car",
    description: "Affordable, compact rides",
    type: "car",
    image: "car.png",
    price: 193.8,
  },
  {
    id: 2,
    name: "Bike",
    description: "Affordable, motorcycle rides",
    type: "bike",
    image: "bike.webp",
    price: 254.7,
  },
  {
    id: 3,
    name: "Auto",
    description: "Affordable, auto rides",
    type: "auto",
    image: "auto.webp",
    price: 200.0,
  },
];

function SelectVehicle({
  selectedVehicle,
  showPanel,
  setShowPanel,
  showPreviousPanel,
  showNextPanel,
  fare,
  inlineMode = false,
}) {
  // Inline mode - renders directly in the left panel
  if (inlineMode && showPanel) {
    return (
      <div className="space-y-4">
        {/* Back button */}
        <button
          onClick={() => {
            setShowPanel(false);
            showPreviousPanel(true);
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-2"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>

        <h2 className="text-xl font-bold text-gray-900">Choose a ride</h2>
        
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
            <Vehicle
              key={vehicle.id}
              vehicle={vehicle}
              fare={fare}
              selectedVehicle={selectedVehicle}
              setShowPanel={setShowPanel}
              showNextPanel={showNextPanel}
            />
          ))}
        </div>
      </div>
    );
  }

  // Modal mode - original overlay behavior
  return (
    <>
      {/* Overlay backdrop */}
      {showPanel && (
        <div 
          className="absolute inset-0 bg-black/40 z-0 pointer-events-auto transition-opacity duration-300"
          onClick={() => {
            setShowPanel(false);
            showPreviousPanel(true);
          }}
          aria-label="Close vehicle selection"
        />
      )}

      {/* Vehicle Selection Panel */}
      <div
        className={`${
          showPanel ? "bottom-0 z-10 pointer-events-auto" : "-bottom-full"
        } transition-all duration-500 absolute bg-white w-full rounded-t-3xl p-6 pt-2 shadow-2xl left-0 right-0`}
        style={{
          maxHeight: "70vh",
          overflowY: "auto",
          boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.15)"
        }}
      >
        <div
          onClick={() => {
            setShowPanel(false);
            showPreviousPanel(true);
          }}
          className="flex justify-center py-2 pb-4 cursor-pointer"
        >
          <ChevronDown strokeWidth={2.5} className="text-gray-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Select a vehicle</h2>
        
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
            <Vehicle
              key={vehicle.id}
              vehicle={vehicle}
              fare={fare}
              selectedVehicle={selectedVehicle}
              setShowPanel={setShowPanel}
              showNextPanel={showNextPanel}
            />
          ))}
        </div>
      </div>
    </>
  );
}

const Vehicle = ({
  vehicle,
  selectedVehicle,
  fare,
  setShowPanel,
  showNextPanel,
}) => {
  return (
    <div
      onClick={() => {
        selectedVehicle(vehicle.type);
        setShowPanel(false);
        showNextPanel(true);
      }}
      className="cursor-pointer flex items-center gap-4 w-full px-4 py-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-black transition-all duration-150 overflow-hidden"
    >
      <div className="shrink-0">
        <img
          src={`/${vehicle.image}`}
          className="w-20 h-20 object-contain mix-blend-multiply"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-gray-900">{vehicle.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{vehicle.description}</p>
      </div>
      <div className="shrink-0 text-right">
        <h3 className="text-xl font-bold text-gray-900">₹{fare[vehicle.type]}</h3>
      </div>
    </div>
  );
};
export default SelectVehicle;
