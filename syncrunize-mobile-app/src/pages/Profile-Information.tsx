import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonItem,
  IonInput,
  IonLabel,
  IonIcon,
  IonButton, IonCol, IonGrid, IonRow, IonSelect, IonSelectOption, IonToast
} from "@ionic/react";
import { person, mail } from "ionicons/icons";
import "../theme/Profile-Information.css";
import "../theme/global.css";
import { UsersApi } from "../services/users";

const ProfileInformation: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [weight, setWeight] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{open: boolean; msg: string; color?: string}>({open:false, msg:''});

  useEffect(() => {
    (async () => {
      try {
        const me = await UsersApi.me();
        setName(me.name || '');
        setEmail(me.email || '');
        setGender((me.gender as any) || '');
        setWeight(me.weight_kg != null ? String(me.weight_kg) : '');
      } catch (_) {}
    })();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      setToast({open:true, msg:'Please enter your name', color:'danger'});
      return;
    }
    const weightNum = weight ? Number(weight) : null;
    if (weight && (isNaN(Number(weight)) || Number(weight) <= 0)) {
      setToast({open:true, msg:'Weight must be a positive number', color:'danger'});
      return;
    }
    try {
      setSaving(true);
      await UsersApi.updateMe({ name, gender: gender || null, weight_kg: weightNum });
      setToast({open:true, msg:'Saved successfully', color:'success'});
    } catch (e: any) {
      setToast({open:true, msg: e?.message || 'Failed to save', color:'danger'});
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    console.log("Cancelled");
    // Add cancel logic here
  };

  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar >
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Profile Information</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Content */}
      <IonContent  className="ion-padding dark-content">
        {/* Name */}
        <IonItem className="profile-input">
          <IonIcon color="success" icon={person} slot="start" className="profile-icon" />
          <IonLabel position="stacked">Name</IonLabel>
          <IonInput
            value={name}
            onIonInput={(e) => setName(e.detail.value!)}
            placeholder=""
          />
        </IonItem>

        {/* Email Address */}
        <IonItem className="profile-input">
          <IonIcon color="success" icon={mail} slot="start" className="profile-icon" />
          <IonLabel position="stacked">Email Address</IonLabel>
          <IonInput
            type="email"
            value={email}
            readonly
            placeholder=""
          />
        </IonItem>

        {/* Gender */}
        <IonItem className="profile-input">
          <IonLabel position="stacked">Gender</IonLabel>
          <IonSelect value={gender} placeholder="Select gender" onIonChange={(e) => setGender(e.detail.value!)}>
            <IonSelectOption value="male">Male</IonSelectOption>
            <IonSelectOption value="female">Female</IonSelectOption>
            <IonSelectOption value="other">Other</IonSelectOption>
          </IonSelect>
        </IonItem>

        {/* Weight (kg) */}
        <IonItem className="profile-input">
          <IonLabel position="stacked">Weight (kg)</IonLabel>
          <IonInput
            type="number"
            inputMode="decimal"
            value={weight}
            onIonInput={(e) => setWeight(e.detail.value!)}
            placeholder="e.g. 65"
          />
        </IonItem>

       
        {/* Buttons */}
<IonGrid className="dark-content">
  <IonRow>
    <IonCol size="6">
      <IonButton
        expand="block"
        color="medium"
        onClick={handleCancel}
        className="cancel-button"
      >
        Cancel
      </IonButton>
    </IonCol>
    <IonCol size="6">
      <IonButton
        expand="block"
        color="success"
        onClick={handleSave}
        disabled={saving}
        className="save-button"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </IonButton>
    </IonCol>
  </IonRow>
</IonGrid>
        <IonToast isOpen={toast.open} onDidDismiss={() => setToast({open:false,msg:''})} message={toast.msg} duration={2000} color={toast.color}/>
      </IonContent>
    </IonPage>
  );
};

export default ProfileInformation;
