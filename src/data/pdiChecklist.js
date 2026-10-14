const item = (categoryId, title, description = `Inspect ${title.toLowerCase()} and record any visible or functional concerns.`) => ({
  id: `${categoryId}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
  title,
  description,
})

const makeCategory = (id, title, icon, description, titles, extra = {}) => ({
  id, title, icon, description, ...extra, items: titles.map((entry) =>
    Array.isArray(entry) ? item(id, entry[0], entry[1]) : item(id, entry)),
})

export const checklistCategories = [
  makeCategory('hvac', 'Heating, Cooling & Ventilation', 'thermometer', 'Start these systems first so they have time to run while you inspect the home.', [
    ['Start heating system', 'Start the system early and allow time for conditioned air to circulate.'],
    'Check thermostat operation', 'Verify warm air reaches each room', 'Check heating registers', 'Check return air vents',
    'Listen for abnormal furnace noises', 'Check heating controls',
    ['Test A/C only when outdoor conditions permit safe operation', 'Operate cooling only within manufacturer-approved outdoor temperature conditions.'],
    'Verify cooling operation when testable', 'Test bathroom exhaust fans', 'Test kitchen exhaust fan', 'Check HRV/ERV system',
    'Verify ventilation grilles', 'Check furnace filter access', 'Verify mechanical system demonstration',
    ['Record systems that cannot be tested due to outdoor temperature', 'Document the reason rather than marking an untested system as passed.'],
  ], { banner: 'START FIRST — These systems require time to test.', caution: 'Do not switch quickly between heating and cooling. Operate cooling equipment only within manufacturer-approved conditions.' }),

  makeCategory('plumbing', 'Hot Water, Plumbing & Drainage', 'droplets', 'Run fixtures long enough to reveal slow drainage, temperature, pressure, or leak concerns.', [
    'Test hot water in kitchen', 'Test hot water in each bathroom', 'Check hot and cold water at every faucet', 'Check water pressure',
    'Test showerheads', 'Test bathtub faucets', 'Fill and drain sinks', 'Check sink stoppers', 'Flush every toilet', 'Check toilet stability',
    'Inspect below sinks for leaks', 'Inspect toilet bases for leaks', 'Check drains', 'Check shower drainage', 'Check bathtub drainage',
    'Check visible pipe connections', 'Test exterior water taps', 'Locate main water shutoff', 'Check water heater',
    'Inspect caulking around plumbing fixtures', 'Inspect sump pump if installed',
    ['Recheck plumbing for leaks before leaving', 'Return after other tests and look again for fresh moisture or drips.'],
  ]),

  makeCategory('electrical', 'Electrical Outlets, Switches & Lighting', 'zap', 'Test accessible devices safely without opening panels, covers, or exposed wiring.', [
    ['Bring a mobile phone and charger', 'Use a charger for a basic power check; it does not verify wiring or grounding.'],
    'Plug the charger into every accessible power outlet', 'Test both receptacles of duplex outlets', 'Test bedroom outlets',
    'Test living room outlets', 'Test dining room outlets', 'Test kitchen outlets', 'Test bathroom outlets', 'Test basement outlets',
    'Test hallway outlets', 'Test garage outlets', 'Test outdoor outlets', 'Check GFCI test/reset functionality',
    'Check available AFCI protection demonstration', 'Test every wall switch', 'Test ceiling lights', 'Test recessed lights',
    'Test bathroom vanity lights', 'Test dimmer switches', 'Test stairway switches', 'Check under-cabinet lighting if included',
    'Check electrical panel labels', 'Test doorbell', 'Check installed USB charging outlets',
    'Check installed network outlets against agreement', 'Check smoke alarms', 'Check carbon monoxide alarms',
  ], { caution: 'A mobile charger confirms basic power availability only. Correct wiring and grounding require an appropriate outlet tester and, when needed, a qualified electrician. Never open electrical panels or exposed wiring.' }),

  makeCategory('doors', 'Doors', 'door-open', 'Open, close, latch, and inspect each door rather than sampling one area.', [
    'Front entrance door', 'Rear exterior door', 'Patio door', 'Bedroom doors', 'Bathroom doors', 'Closet doors', 'Basement doors',
    'Utility room doors', 'Garage entry door', 'Door handles', 'Deadbolts', 'Door latches', 'Hinges', 'Door frames', 'Door trim',
    'Weatherstripping', 'Door thresholds', 'Paint damage', 'Scratches', 'Dents', 'Sliding door tracks',
    'Self-closing garage entry door where required',
  ], { banner: 'Open, close and lock every accessible door individually.' }),

  makeCategory('windows', 'Windows', 'panel-top', 'Operate and inspect every accessible window, including its lock, screen, seals, and finish.', [
    'Open every operable window', 'Close every operable window', 'Lock every window', 'Check sliding or crank mechanisms',
    'Inspect glass scratches', 'Inspect broken or chipped glass', 'Check moisture between panes', 'Check window seals',
    'Check weatherstripping', 'Inspect frame alignment', 'Inspect caulking', 'Check insect screens', 'Inspect window sills',
    'Inspect basement windows', 'Check window trim', 'Check window handles', 'Check safety restrictors where provided',
    'Record inaccessible windows',
  ], { banner: 'Test every operable window individually, not just one per room.' }),

  makeCategory('kitchen', 'Kitchen', 'cooking-pot', 'Inspect finishes, storage, plumbing, and included appliances for condition and operation.', [
    'Countertops', 'Cabinets', 'Cabinet doors', 'Drawer operation', 'Soft-close hinges', 'Handles', 'Cabinet interiors', 'Backsplash',
    'Grout', 'Caulking', 'Kitchen sink', 'Faucet', 'Sprayer', 'Drainage', 'Under-sink leaks', 'Kitchen floor',
    'Refrigerator if included', 'Stove if included', 'Oven if included', 'Microwave if included', 'Dishwasher if included',
    'Range hood', 'Kitchen island', 'Appliance clearances',
  ]),

  makeCategory('bathrooms', 'Bathrooms & Powder Rooms', 'bath', 'Repeat fixture, finish, ventilation, and safety checks in every bathroom and powder room.', [
    'Toilet flushing', 'Toilet movement or leaks', 'Faucets', 'Hot and cold water', 'Sink drainage', 'Bathtub', 'Shower',
    'Showerhead', 'Shower doors', 'Shower seals', 'Vanity', 'Vanity drawers', 'Bathroom mirror', 'Floor tiles', 'Wall tiles',
    'Grout', 'Caulking', 'Exhaust fan', 'Electrical sockets', 'Light fixtures', 'Bathroom accessories', 'Water damage', 'Door locks',
  ]),

  makeCategory('living', 'Bedrooms, Living & Dining Rooms', 'sofa', 'Check each finished room methodically from ceiling to floor, including agreed upgrades.', [
    'Wall finish', 'Paint finish', 'Ceiling finish', 'Flooring damage', 'Flooring gaps', 'Flooring squeaks', 'Carpet seams',
    'Interior doors', 'Closets', 'Shelving', 'Windows', 'Electrical sockets', 'Switches', 'Light fixtures',
    'Heating/cooling vents', 'Baseboards', 'Trim', 'Fireplace if included', 'Agreed upgrades',
  ]),

  makeCategory('stairs', 'Stairs, Railings & Hallways', 'stairs', 'Check walking surfaces, guards, rails, finishes, lighting, and switches.', [
    'Stair stability', 'Stair squeaks', 'Stair finish', 'Handrails', 'Guardrails', 'Stair nosing', 'Stair lighting',
    'Two-location switches where installed', 'Hallway flooring', 'Hallway walls', 'Hallway doors',
  ]),

  makeCategory('basement', 'Basement & Utility Room', 'warehouse', 'Look for moisture, cracking, incomplete work, and accessible mechanical connections.', [
    'Foundation cracks', 'Water stains', 'Dampness', 'Basement floor cracks', 'Basement windows', 'Window wells',
    'Exposed insulation', 'Vapour barrier', 'Floor drain', 'Sump pump if included', 'Furnace location', 'Water heater',
    'Mechanical connections', 'Plumbing leaks', 'Electrical outlets', 'Basement lighting', 'Basement stairs',
  ]),

  makeCategory('garage', 'Garage', 'warehouse', 'Operate the overhead door safely and inspect the enclosure, controls, and entry door.', [
    'Garage door operation', 'Garage door remote', 'Wall control', 'Safe photo-eye/safety reversal demonstration',
    'Garage door weatherstripping', 'Garage door track', 'Garage entry door', 'Self-closing operation where required',
    'Garage lighting', 'Electrical sockets', 'Garage floor', 'Garage wall finish', 'Garage ceiling finish', 'Garage locks', 'Garage keys',
  ]),

  makeCategory('exterior', 'Exterior, Foundation, Driveway & Landscaping', 'house', 'Walk the accessible perimeter and document damage, drainage concerns, and seasonal work.', [
    'Exterior brickwork', 'Stonework', 'Siding', 'Mortar', 'Exterior caulking', 'Visible roof issues', 'Gutters', 'Downspouts',
    'Foundation condition', 'Grading', 'Surface drainage', 'Driveway', 'Sidewalk', 'Porch', 'Exterior steps', 'Railings',
    'Exterior lights', 'Outdoor outlets', 'Outdoor water taps', 'Patio if included', 'Deck if included', 'Fence if included',
    'Landscaping', 'Sod', 'Seasonal incomplete work',
  ]),

  makeCategory('safety', 'Safety & Security', 'shield-check', 'Confirm accessible safety devices, exits, shutoffs, and included security features.', [
    'Smoke alarms', 'Carbon monoxide alarms', 'Emergency exits', 'Safe window egress', 'Handrails', 'Guardrails',
    'GFCI protection', 'AFCI demonstration', 'Electrical panel access', 'Main water shutoff',
    'Gas shutoff identification where applicable', 'Garage door safety', 'Smart door locks if included',
    'Security system if included', 'Doorbell system', 'Fireplace safety demonstration where applicable',
  ]),

  makeCategory('handover', 'Final Review, Documentation & Handover', 'clipboard-check', 'Complete a final walk-through and leave with the documents, devices, and next steps you need.', [
    'Confirm purchase agreement upgrades', 'Check selected finishes', 'Confirm included appliances', 'Confirm unfinished construction items',
    'Photograph defects', 'Record inaccessible items', 'Record weather-dependent untested items', "Review builder's PDI form",
    'Verify identified deficiencies are recorded', 'Ask how deficiencies will be addressed', 'Obtain PDI form copy',
    'Obtain Certificate of Completion and Possession when applicable', 'Confirm keys', 'Confirm garage remotes',
    'Check builder manuals', 'Check appliance manuals', 'Confirm warranty documentation',
    'Confirm applicable Tarion warranty procedures', 'Final walk-through before leaving',
  ]),
]

export const allChecklistItems = checklistCategories.flatMap((category) =>
  category.items.map((checklistItem) => ({ ...checklistItem, categoryId: category.id, categoryTitle: category.title })),
)

export const statusOptions = [
  { value: 'pass', label: 'Pass', shortLabel: 'Pass', icon: 'circle-check' },
  { value: 'fail', label: 'Fail', shortLabel: 'Fail', icon: 'circle-x' },
  { value: 'not-tested', label: 'Not Tested', shortLabel: 'Untested', icon: 'clock' },
  { value: 'na', label: 'Not Applicable', shortLabel: 'N/A', icon: 'ban' },
]
