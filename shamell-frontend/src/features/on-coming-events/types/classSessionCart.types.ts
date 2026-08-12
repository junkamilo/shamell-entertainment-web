export type ClassCartItem = {
  sessionId: string;
  dateIso: string;
  weekday: number;
  sectionId: string | null;
  label: string;
  startTime: string;
  endTime: string;
  price: number;
  capacity: number;
  seatsRemaining: number;
};

export type ClassSessionCart = {
  items: ClassCartItem[];
};
