import React, { useState } from 'react';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Download, Trash2, GripVertical, AlertCircle, ArrowUpDown, Trash, BarChart3, Coins, History, Layers } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SortableRowProps {
  item: ShortlistItem;
  index: number;
}

function formatPackage(lpa: number | string | undefined) {
  if (!lpa) return '-';
  const val = typeof lpa === 'string' ? parseFloat(lpa) : lpa;
  if (isNaN(val) || val === 0) return '-';
  return `₹${val}L`;
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
    <div ref={setNodeRef} style={style} className={`flex flex-col`}>
      <div className={`border border-outline-variant bg-surface-container-lowest rounded-xl p-3 md:p-4 mb-3 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 hover:border-primary/40 hover:shadow-sm transition-all group ${isDragging ? 'shadow-lg ring-1 ring-primary scale-[1.01]' : ''}`}>
        
        {/* Left Section: Drag Handle & Index */}
        <div className="flex items-center justify-between md:w-auto">
          <div className="flex items-center gap-2">
              <button {...attributes} {...listeners} className="text-on-surface-variant/50 hover:text-on-surface transition-colors cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-surface-container">
                <GripVertical className="size-4.5" />
              </button>
              <span className="w-8 h-8 flex items-center justify-center text-xs font-extrabold text-on-surface-variant bg-surface-container rounded-lg shrink-0">
                {index + 1}
              </span>
          </div>
          
          <button 
             onClick={() => removeFromShortlist(item.id)}
             className="md:hidden p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg bg-surface-container-low transition-colors"
             title="Remove from Shortlist"
          >
            <Trash2 className="size-4.5" />
          </button>
        </div>

        {/* Center Section: Details */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5 md:ml-2">
           <h3 className="font-bold text-sm md:text-[15px] text-on-surface leading-snug break-words pr-2">{item.institute}</h3>
           <div className="flex flex-wrap gap-2 items-center">
             <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">{item.program}</span>
             <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md border border-outline-variant">
               {item.quota} • {item.seatType} • {item.gender.includes('Female') ? 'Female' : 'Neutral'}
             </span>
           </div>
        </div>
        
        {/* Right Section: Stats & Destroy */}
        <div className="flex items-center justify-between md:justify-end gap-5 lg:gap-8 mt-2 md:mt-0 pt-3 md:pt-0 border-t border-outline-variant/50 md:border-t-0 pl-2">
            
            <div className="flex gap-4 sm:gap-6">
               <div className="flex flex-col items-start md:items-end">
                  <span className="text-[9px] uppercase font-bold text-on-surface-variant flex items-center gap-1"><History className="size-3" /> Closing</span>
                  <span className="text-[13px] font-black text-on-surface tabular-nums">{item.closing}</span>
               </div>

               <div className="flex flex-col items-start md:items-end">
                  <span className="text-[9px] uppercase font-bold text-on-surface-variant">Chance</span>
                  <span className="text-[13px] font-black text-primary uppercase">{item.chance || '-'}</span>
               </div>
               
               <div className="flex flex-col items-start md:items-end">
                  <span className="text-[9px] uppercase font-bold text-on-surface-variant flex items-center gap-1"><Coins className="size-3" /> Median</span>
                  <span className="text-[13px] font-bold text-primary tabular-nums text-opacity-80">{formatPackage(item.medianPackage)}</span>
               </div>
            </div>

            <button 
               onClick={() => removeFromShortlist(item.id)}
               className="hidden md:flex p-2.5 text-on-surface-variant/50 hover:text-error hover:bg-error-container/20 border border-transparent hover:border-error/20 rounded-xl transition-all ml-2"
               title="Remove from Shortlist"
            >
              <Trash2 className="size-4" />
            </button>
        </div>
      </div>
    </div>
  );
}

export function Shortlist() {
  const { shortlist, setShortlist, reorderShortlist } = useShortlist();
  
  const [sortType, setSortType] = useState<string>('custom');
  const [groupBy, setGroupBy] = useState<string>('none');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setSortType('custom');
      setGroupBy('none');
      const oldIndex = shortlist.findIndex((item) => item.id === active.id);
      const newIndex = shortlist.findIndex((item) => item.id === over.id);
      reorderShortlist(oldIndex, newIndex);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header setup
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('My JEE Preference List', 14, 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated exactly on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-US')}`, 14, 26);

    const tableColumn = ["#", "Institute Name", "Branch / Program"];
    const tableRows = shortlist.map((item, index) => [
      index + 1,
      item.institute,
      `${item.program} (${item.quota}/${item.seatType.substring(0,6)})`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 41, 59], font: 'helvetica' },
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', lineColor: [203, 213, 225], lineWidth: 0.1 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [59, 130, 246] },
        4: { fontStyle: 'bold' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 40;
    
    doc.setFillColor(248, 250, 252);
    doc.rect(0, finalY + 10, 210, 30, 'F');
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('JEE Toolkit', 105, finalY + 20, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.text('Built for smarter admission choices.', 105, finalY + 25, { align: 'center' });
    doc.setTextColor(37, 99, 235);
    doc.textWithLink('jeetoolkit.web.app', 105, finalY + 31, { url: 'https://jeetoolkit.web.app', align: 'center' });

    doc.save(`JEE_Choices_${new Date().getTime()}.pdf`);
  };

  const handleSortGroup = (newSort: string, newGroup: string) => {
    setSortType(newSort);
    setGroupBy(newGroup);

    const sorted = [...shortlist];
    sorted.sort((a, b) => {
      // 1. Grouping
      if (newGroup === 'college') {
        const c = a.institute.localeCompare(b.institute);
        if (c !== 0) return c;
      } else if (newGroup === 'branch') {
        const c = a.program.localeCompare(b.program);
        if (c !== 0) return c;
      }

      // 2. Sorting
      if (newSort === 'cutoff') {
        return a.closing - b.closing;
      } else if (newSort === 'alphabetical') {
        const ci = a.institute.localeCompare(b.institute);
        if (ci !== 0) return ci;
        return a.program.localeCompare(b.program);
      }

      return 0; // custom sort just implies "do not alter current order within matched group/sort" but running array.sort is destructive of custom order if not careful. Actually, standard sort holds relative order if stable.
    });

    setShortlist(sorted);
  };

  const handleClear = () => {
    if(confirm('Are you sure you want to clear your entire preference list?')) {
      setShortlist([]);
    }
  }

  const handleReverse = () => {
    setSortType('custom');
    setGroupBy('none');
    setShortlist([...shortlist].reverse());
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
      <header className="h-[76px] border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="font-extrabold text-xl tracking-tight text-on-surface">Preference List</h2>
          <span className="bg-primary/10 px-2.5 py-1 rounded-md text-[11px] text-primary font-bold uppercase tracking-wider hidden sm:block">
            {shortlist.length} Saved
          </span>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={handleClear}
             disabled={shortlist.length === 0}
             className="px-3.5 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2 border border-outline-variant bg-surface text-on-surface hover:bg-error hover:text-on-error hover:border-error disabled:opacity-50 disabled:pointer-events-none"
           >
             <Trash className="size-4" />
             <span className="hidden sm:inline">Clear List</span>
           </button>
           <button 
             onClick={handleExportPDF}
             disabled={shortlist.length === 0}
             className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:shadow hover:bg-primary-container transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
           >
             <Download className="size-4" />
             <span>Export PDF</span>
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
          
          {/* Controls Bar */}
          {shortlist.length > 0 && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-5 justify-between">
             
             {/* Left: Group & Sort */}
             <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest bg-surface-container px-2 py-1 rounded">Group</span>
                  <select 
                    value={groupBy}
                    onChange={(e) => handleSortGroup(sortType, e.target.value)}
                    className="text-[13px] font-bold px-3 py-1.5 bg-surface rounded-lg border border-outline-variant text-on-surface focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  >
                    <option value="none">No Grouping</option>
                    <option value="college">By College</option>
                    <option value="branch">By Branch</option>
                  </select>
                </div>

                <div className="hidden sm:block w-px h-6 bg-outline-variant/60"></div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest bg-surface-container px-2 py-1 rounded">Sort</span>
                  <select 
                    value={sortType}
                    onChange={(e) => handleSortGroup(e.target.value, groupBy)}
                    className="text-[13px] font-bold px-3 py-1.5 bg-surface rounded-lg border border-outline-variant text-on-surface focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  >
                    <option value="custom">Custom (Drag & Drop)</option>
                    <option value="cutoff">Best Cutoff (Toughest First)</option>
                    <option value="alphabetical">Alphabetical</option>
                  </select>
                </div>
             </div>

             {/* Right: Actions */}
             <div className="flex items-center gap-3">
                <button 
                  onClick={handleReverse}
                  className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-lg text-[13px] font-bold text-on-surface transition-colors border border-outline-variant flex items-center gap-1.5"
                >
                  <ArrowUpDown className="size-3.5" />
                  Reverse
                </button>
                <p className="text-[11px] font-bold text-on-surface-variant/70 flex items-center gap-1.5">
                   <AlertCircle className="size-3.5" /> Drag changes sort to Custom
                </p>
             </div>
          </div>
          )}

          {/* List Area */}
          {shortlist.length > 0 ? (
            <div className="flex flex-col pb-20">
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
            <div className="mt-8 bg-surface-container-lowest border border-outline-variant rounded-2xl p-12 text-center text-on-surface-variant flex flex-col items-center shadow-sm">
              <div className="size-20 bg-surface-container rounded-2xl flex items-center justify-center mb-6">
                 <AlertCircle className="size-10 text-on-surface-variant/50" />
              </div>
              <h3 className="font-extrabold text-2xl text-on-surface mb-2">Shortlist is Empty</h3>
              <p className="text-[15px] font-medium max-w-md leading-relaxed">
                Start building your preference list by starring items in the Predictor or Cutoff Search panels.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

