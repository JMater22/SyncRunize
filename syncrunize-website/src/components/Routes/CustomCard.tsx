import React, { ReactNode } from "react";
import { IonCard } from "@ionic/react";

interface CustomCardProps extends React.ComponentProps<typeof IonCard> {
  className?: string;
  children?: ReactNode;
}

const CustomCard: React.FC<CustomCardProps> = ({ className, children, ...rest }) => {
  return (
    <IonCard className={`custom-card ${className || ""}`} {...rest}>
      {children}
    </IonCard>
  );
}; 

export default CustomCard;
