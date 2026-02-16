// export interface MaterialInfo {
//     material: string;
//     points: number;
//     name: string;
//     recyclable: boolean; // <--- New flag to control the button
// }

// // Noise labels to ignore
// const IGNORED_LABELS = [
//     'product', 'material', 'rectangle', 'font', 'electric blue', 
//     'pattern', 'logo', 'brand', 'graphics', 'design', 'art', 
//     'color', 'liquid', 'fluid', 'container', 'object', 'transparent',
//     'item', 'thing', 'shape', 'daylight', 'sky', 'snapshot', 'image'
// ];

// export function mapLabelsToMaterial(labels: string[]): MaterialInfo {
//     const lowerLabels = labels.map(l => l.toLowerCase());

//     const findSpecific = (excludeList: string[] = []): string => {
//         const allExclusions = [...IGNORED_LABELS, ...excludeList];
//         const match = labels.find(originalLabel => {
//             const lower = originalLabel.toLowerCase();
//             return !allExclusions.some(exc => lower.includes(exc));
//         });
//         return match ? ` (${match})` : '';
//     };

//     // --- PRIORITY 1: NON-RECYCLABLE OBJECTS (Block Add to Cart) ---
//     const nonBinItems = [
//         'vehicle', 'car', 'transport', 'bicycle', 'boat', 'wheel', 'tire',
//         'furniture', 'table', 'chair', 'sofa', 'couch', 'bed', 'cabinet',
//         'building', 'house', 'room', 'floor', 'wall', 'door',
//         'animal', 'mammal', 'bird', 'person', 'human', 'face', 'hair'
//     ];

//     if (lowerLabels.some(l => nonBinItems.some(k => l.includes(k)))) {
//         const specific = findSpecific(nonBinItems); 
//         return { 
//             material: 'Cannot Recycle', 
//             points: 0, 
//             name: `Unidentified${specific}`,
//             recyclable: false // <--- BLOCK USER
//         };
//     }

//     // --- PRIORITY 2: E-Waste (Valid) ---
//     const eWasteKeywords = ['electronic', 'phone', 'mobile', 'laptop', 'computer', 'circuit', 'technology', 'watch', 'clock', 'smartwatch', 'battery', 'device', 'camera'];
//     if (lowerLabels.some(l => eWasteKeywords.some(k => l.includes(k)))) {
//         const specific = findSpecific(['electronic', 'device', 'technology']);
//         return { material: 'E-Waste', points: 20, name: `Electronic${specific}`, recyclable: true };
//     }

//     // --- PRIORITY 3: Recyclable Materials (Valid) ---
//     // Metal
//     if (lowerLabels.some(l => ['can', 'aluminum', 'tin', 'steel', 'foil'].some(k => l.includes(k)))) {
//         const specific = findSpecific(['metal', 'aluminum', 'tin', 'steel']);
//         return { material: 'Metal', points: 10, name: `Metal${specific}`, recyclable: true };
//     }
//     // Glass
//     if (lowerLabels.some(l => ['glass', 'jar', 'wine', 'beer'].some(k => l.includes(k)))) {
//         const specific = findSpecific(['glass']);
//         return { material: 'Glass', points: 8, name: `Glass${specific}`, recyclable: true };
//     }
//     // Plastic
//     if (lowerLabels.some(l => ['plastic', 'polyethylene', 'bottle', 'tub', 'cup'].some(k => l.includes(k)))) {
//         const specific = findSpecific(['plastic', 'polyethylene', 'container']);
//         return { material: 'Plastic', points: 5, name: `Plastic${specific}`, recyclable: true };
//     }
//     // Paper
//     if (lowerLabels.some(l => ['paper', 'cardboard', 'box', 'carton', 'newspaper', 'magazine', 'book'].some(k => l.includes(k)))) {
//         const specific = findSpecific(['paper', 'cardboard']);
//         return { material: 'Paper', points: 3, name: `Paper${specific}`, recyclable: true };
//     }

//     // --- PRIORITY 4: Fallback / General Waste (Block Add to Cart) ---
//     const specificMatch = findSpecific([]);
//     return { 
//         material: 'General Waste', 
//         points: 0, 
//         name: `Unidentified${specificMatch}`,
//         recyclable: false // <--- BLOCK USER
//     };
// }


//❗❗❗
export interface MaterialInfo {
    material: string;
    points: number;
    name: string;
    recyclable: boolean;
    instruction: string;
    co2: number; // Added CO2 in kg
}

// Noise labels to ignore in naming
const IGNORED_LABELS = [
    'product', 'material', 'rectangle', 'font', 'electric blue',
    'pattern', 'logo', 'brand', 'graphics', 'design', 'art',
    'color', 'liquid', 'fluid', 'container', 'object', 'transparent',
    'item', 'thing', 'shape', 'daylight', 'sky', 'snapshot', 'image'
];

export function mapLabelsToMaterial(labels: string[]): MaterialInfo {
    const lowerLabels = labels.map(l => l.toLowerCase());

    // Helper to find specific name
    const findSpecific = (excludeList: string[] = []): string => {
        const allExclusions = [...IGNORED_LABELS, ...excludeList];
        const match = labels.find(originalLabel => {
            const lower = originalLabel.toLowerCase();
            return !allExclusions.some(exc => lower.includes(exc));
        });
        return match ? ` (${match})` : '';
    };

    // Helper to detect contamination (food/liquid residue)
    const isDirty = lowerLabels.some(l =>
        l.includes('food') || l.includes('drink') || l.includes('liquid') || l.includes('organic') || l.includes('residue')
    );

    // --- PRIORITY 1: NON-RECYCLABLE OBJECTS (Block) ---
    const nonBinItems = [
        'vehicle', 'car', 'transport', 'bicycle', 'boat', 'wheel', 'tire',
        'furniture', 'table', 'chair', 'sofa', 'couch', 'bed', 'cabinet',
        'building', 'house', 'room', 'floor', 'wall', 'door',
        'animal', 'mammal', 'bird', 'person', 'human', 'face', 'hair'
    ];

    // Helper to check if a keyword exists as a whole word in any label
    const hasWholeWordMatch = (keywords: string[]) => {
        return lowerLabels.some(label =>
            keywords.some(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'i');
                return regex.test(label);
            })
        );
    };

    if (hasWholeWordMatch(nonBinItems)) {
        const specific = findSpecific(nonBinItems);
        return {
            material: 'Cannot Recycle',
            points: 0,
            name: `Unidentified${specific}`,
            recyclable: false,
            instruction: 'This item is not suitable for smart recycling bins.',
            co2: 0
        };
    }

    // --- PRIORITY 2: E-Waste ---
    const eWasteKeywords = ['electronic', 'phone', 'mobile', 'laptop', 'computer', 'circuit', 'technology', 'watch', 'clock', 'smartwatch', 'battery', 'device', 'camera'];
    if (lowerLabels.some(l => eWasteKeywords.some(k => l.includes(k)))) {
        const specific = findSpecific(['electronic', 'device', 'technology']);
        return {
            material: 'E-Waste',
            points: 20,
            name: `Electronic${specific}`,
            recyclable: true,
            instruction: 'Ensure personal data is wiped. Remove loose batteries if possible.',
            co2: 2.5 // High impact
        };
    }

    // --- PRIORITY 3: Recyclable Materials ---

    // 3a. EXPLICIT PLASTIC (High Priority)
    // We check for "plastic" or "polyethylene" explicitly first. 
    // This ensures "Plastic bottle" is identified as Plastic, even if "Glass" is also present as a lower-confidence label.
    if (lowerLabels.some(l => ['plastic', 'polyethylene'].some(k => l.includes(k)))) {
        const specific = findSpecific(['plastic', 'polyethylene', 'container']);
        return {
            material: 'Plastic',
            points: 5,
            name: `Plastic${specific}`,
            recyclable: true,
            instruction: isDirty ? 'Please empty all liquids and rinse the container.' : 'Remove the cap if it is not plastic. Crush to save space.',
            co2: 0.5
        };
    }

    // Metal
    if (lowerLabels.some(l => ['can', 'aluminum', 'tin', 'steel', 'foil'].some(k => l.includes(k)))) {
        const specific = findSpecific(['metal', 'aluminum', 'tin', 'steel']);
        return {
            material: 'Metal',
            points: 10,
            name: `Metal${specific}`,
            recyclable: true,
            instruction: isDirty ? 'Please rinse out any food or liquid residue before recycling.' : 'Empty contents completely. Do not crush cans if possible.',
            co2: 1.5
        };
    }

    // Glass
    if (lowerLabels.some(l => ['glass', 'jar', 'wine', 'beer'].some(k => l.includes(k)))) {
        const specific = findSpecific(['glass']);
        return {
            material: 'Glass',
            points: 8,
            name: `Glass${specific}`,
            recyclable: true,
            instruction: 'Remove lids or corks. Rinse the bottle/jar thoroughly.',
            co2: 0.8
        };
    }

    // 3b. INFERRED PLASTIC (Lower Priority)
    // If it hasn't been identified as Metal or Glass, but is a "bottle", "tub", or "cup", we assume Plastic.
    if (lowerLabels.some(l => ['bottle', 'tub', 'cup'].some(k => l.includes(k)))) {
        const specific = findSpecific(['plastic', 'polyethylene', 'container']);
        return {
            material: 'Plastic',
            points: 5,
            name: `Plastic${specific}`,
            recyclable: true,
            instruction: isDirty ? 'Please empty all liquids and rinse the container.' : 'Remove the cap if it is not plastic. Crush to save space.',
            co2: 0.5
        };
    }

    // Paper
    if (lowerLabels.some(l => ['paper', 'cardboard', 'box', 'carton', 'newspaper', 'magazine', 'book'].some(k => l.includes(k)))) {
        const specific = findSpecific(['paper', 'cardboard']);

        // Special check for dirty paper (Pizza boxes, etc.)
        if (isDirty) {
            return {
                material: 'Contaminated Paper',
                points: 0,
                name: `Soiled Paper${specific}`,
                recyclable: false, // Dirty paper cannot be recycled!
                instruction: 'Paper contaminated with food or oil cannot be recycled.',
                co2: 0
            };
        }

        return {
            material: 'Paper',
            points: 3,
            name: `Paper${specific}`,
            recyclable: true,
            instruction: 'Flatten boxes. Remove plastic tape, stickers, or glossy covers.',
            co2: 0.3
        };
    }

    // --- PRIORITY 4: Fallback ---
    const specificMatch = findSpecific([]);
    return {
        material: 'General Waste',
        points: 12,
        name: `Unidentified${specificMatch}`,
        recyclable: false,
        instruction: 'Material could not be identified. Please discard in general waste.',
        co2: 12
    };
}

