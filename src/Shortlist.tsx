import React from 'react';
import { useShortlist, ShortlistItem } from './ShortlistContext';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Download, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SortableRowProps {
  item: ShortlistItem;
  index: number;
}

function SortableRow({ item, index }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });
  
  const { removeFromShortlist } = useShortlist();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`border border-outline-variant bg-surface-container-lowest rounded-lg p-3 md:p-4 mb-3 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 hover:border-primary/30 transition-colors ${isDragging ? 'shadow-lg ring-1 ring-primary' : 'shadow-sm'}`}>
      
      {/* Mobile Top Header (Pref + Actions) / Desktop Drag Handle */}
      <div className="flex items-center justify-between md:w-auto">
        <div className="flex items-center gap-2">
            <button {...attributes} {...listeners} className="text-on-surface-variant hover:text-on-surface transition-colors cursor-grab active:cursor-grabbing p-1.5 rounded bg-surface-container-low hover:bg-surface-container">
              <GripVertical className="size-4 md:size-5" />
            </button>
            <span className="md:w-8 text-center text-sm font-bold text-on-surface bg-surface-container px-2 py-1 rounded">#{index + 1}</span>
        </div>
        
        <button 
           onClick={() => removeFromShortlist(item.id)}
           className="md:hidden p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded bg-surface-container-low transition-colors"
           title="Remove from Shortlist"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
         <span className="font-bold text-sm md:text-base text-on-surface leading-snug">{item.institute}</span>
         <span className="text-xs md:text-sm text-primary font-semibold bg-primary/5 px-2 py-0.5 rounded w-fit">{item.program}</span>
         <span className="text-[11px] md:text-xs font-semibold text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded w-fit mt-1">Quota: {item.quota} | Type: {item.seatType}</span>
      </div>
      
      <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8 mt-2 md:mt-0 pt-3 md:pt-0 border-t border-outline-variant/30 md:border-t-0">
          <div className="flex flex-col md:items-end">
             <span className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Closing Rank</span>
             <span className="text-sm font-black tabular-nums">{item.closing}</span>
          </div>
          <div className="flex flex-col md:items-end">
             <span className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Chance</span>
             <span className="text-sm font-black text-primary uppercase">{item.chance || '-'}</span>
          </div>
          
          <button 
             onClick={() => removeFromShortlist(item.id)}
             className="hidden md:flex p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-2"
             title="Remove from Shortlist"
          >
            <Trash2 className="size-4.5" />
          </button>
      </div>
    </div>
  );
}

export function Shortlist() {
  const { shortlist, setShortlist, reorderShortlist } = useShortlist();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = shortlist.findIndex((item) => item.id === active.id);
      const newIndex = shortlist.findIndex((item) => item.id === over.id);
      reorderShortlist(oldIndex, newIndex);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('My JEE Choice Filling Shortlist', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 21);

    const tableColumn = ["Pref", "Institute", "Academic Program", "Quota/Type", "Closing", "Chance"];
    const tableRows = shortlist.map((item, index) => [
      index + 1,
      item.institute,
      item.program,
      `${item.quota} / ${item.seatType}`,
      item.closing,
      item.chance || '-'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 160, 133], textColor: 255 }
    });

    doc.save(`JEE_Choice_List_${new Date().getTime()}.pdf`);
  };

  const handleSort = (type: 'median' | 'nirf' | 'cutoff' | 'alphabetical') => {
    const sorted = [...shortlist];
    if (type === 'cutoff') {
      sorted.sort((a, b) => a.closing - b.closing);
    } else if (type === 'alphabetical') {
       sorted.sort((a, b) => {
          const c = a.institute.localeCompare(b.institute);
          if (c !== 0) return c;
          return a.program.localeCompare(b.program);
       });
    }
    // We would need to pass median/nirf via Context or fetch it. For now, since those properties are added to ShortlistItem optionally, let's sort by them if available.
    else if (type === 'nirf') {
      sorted.sort((a, b) => {
         const nA = typeof a.nirfOverall === 'number' ? a.nirfOverall : 9999;
         const nB = typeof b.nirfOverall === 'number' ? b.nirfOverall : 9999;
         return nA - nB;
      });
    } else if (type === 'median') {
        sorted.sort((a, b) => {
         const mA = typeof a.medianPackage === 'number' ? a.medianPackage : 0;
         const mB = typeof b.medianPackage === 'number' ? b.medianPackage : 0;
         return mB - mA;
      });
    }
    setShortlist(sorted);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      <header className="h-20 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between px-gutter flex-shrink-0 gap-4">
        <div className="flex items-center gap-4 flex-shrink-0">
          <h2 className="font-bold text-lg text-on-surface">My Shortlist</h2>
          <span className="bg-primary/10 px-2.5 py-0.5 rounded text-[11px] text-primary font-bold uppercase tracking-wider border border-primary/20">
            {shortlist.length} Items Saved
          </span>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={handleExportPDF}
             className="bg-primary text-on-primary px-4 py-2 rounded text-sm font-bold shadow hover:bg-primary/95 transition flex items-center gap-2"
           >
             <Download className="size-4" />
             Export PDF
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full p-4 md:p-8">
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
          
          {/* Controls Bar */}
          {shortlist.length > 0 && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-4 justify-between">
             <div className="flex items-center gap-3">
               <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Presets:</span>
               <div className="flex gap-2 flex-wrap">
                  <button onClick={() => handleSort('cutoff')} className="text-xs font-bold px-3 py-1.5 bg-surface-container hover:bg-surface-container-high rounded text-on-surface transition-colors border border-outline-variant">Best Cutoff (Toughest First)</button>
                  <button onClick={() => handleSort('alphabetical')} className="text-xs font-bold px-3 py-1.5 bg-surface-container hover:bg-surface-container-high rounded text-on-surface transition-colors border border-outline-variant">Alphabetical</button>
               </div>
             </div>
             <p className="text-xs text-on-surface-variant flex items-center gap-1.5 font-medium">
               <AlertCircle className="size-4" /> Drag handles to manually reorder preferences
             </p>
          </div>
          )}

          {/* List Area */}
          {shortlist.length > 0 ? (
            <div className="flex flex-col">
               <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
               >
                  <SortableContext 
                    items={shortlist.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                     {shortlist.map((item, index) => (
                       <SortableRow key={item.id} item={item} index={index} />
                     ))}
                  </SortableContext>
               </DndContext>
            </div>
          ) : (
            <div className="mt-8 bg-surface-container-lowest border border-outline-variant rounded p-12 text-center text-on-surface-variant flex flex-col items-center">
              <div className="size-16 bg-surface-container rounded-full flex items-center justify-center mb-4">
                 <AlertCircle className="size-8 text-on-surface-variant/50" />
              </div>
              <p className="font-semibold text-lg text-on-surface">Your Shortlist is Empty</p>
              <p className="text-sm mt-2 max-w-sm">Star an item in the Predictor or Cutoff Search to add it to your shortlist for choice filling.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
