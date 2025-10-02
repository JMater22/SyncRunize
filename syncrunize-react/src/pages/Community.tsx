import React from "react";
import {
  IonPage,
  IonContent,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonButton,
  IonSearchbar,  
} from "@ionic/react";

import Group1 from "../assets/GROUP 1.png";
import Group2 from "../assets/GROUP 2.png";
import "../components/Community/MainGroups.css";
import "../components/Community/CreateGroup.tsx";
import "../components/Community/GroupFeed.tsx";

const Community: React.FC = () => {
  const groups = [
    { id: 1, name: "Pampanga Runners Community", location: "Mabalacat, Pampanga, Philippines", members: "1,078 Runners", image: Group1 },
    { id: 2, name: "Clark Running Club", location: "Angeles, Pampanga, Philippines", members: "1,878 Runners", image: Group2 },
    { id: 3, name: "Pampanga Runners Community", location: "Mabalacat, Pampanga, Philippines", members: "1,078 Runners", image: Group1 },
    { id: 4, name: "Clark Running Club", location: "Angeles, Pampanga, Philippines", members: "1,878 Runners", image: Group2 },
    { id: 5, name: "Pampanga Runners Community", location: "Mabalacat, Pampanga, Philippines", members: "1,078 Runners", image: Group1 },
    { id: 6, name: "Clark Running Club", location: "Angeles, Pampanga, Philippines", members: "1,878 Runners", image: Group2 },
    { id: 7, name: "Pampanga Runners Community", location: "Mabalacat, Pampanga, Philippines", members: "1,078 Runners", image: Group1 },
    { id: 8, name: "Clark Running Club", location: "Angeles, Pampanga, Philippines", members: "1,878 Runners", image: Group2 },
    { id: 9, name: "Pampanga Runners Community", location: "Mabalacat, Pampanga, Philippines", members: "1,078 Runners", image: Group1 },
    { id: 10, name: "Clark Running Club", location: "Angeles, Pampanga, Philippines", members: "1,878 Runners", image: Group2 },
    { id: 11, name: "Pampanga Runners Community", location: "Mabalacat, Pampanga, Philippines", members: "1,078 Runners", image: Group1 },
    { id: 12, name: "Clark Running Club", location: "Angeles, Pampanga, Philippines", members: "1,878 Runners", image: Group2 }
  ];

  return (
    <IonPage>
      <IonContent className="ion-padding">
        {/* ✅ Page Header */}
        <section className="groups-page-header">
          <h1 className="page-title">Groups</h1>
          <IonButton className="create-group-btn" routerLink="/create-group">
            Create a Group
          </IonButton>
        </section>

        {/* ✅ Filter / Search */}
        <section className="filter-search-bar">
          <IonGrid>
            <IonRow className="filter-row ion-align-items-center ion-justify-content-between">
              <IonCol size="12" sizeMd="6">
                <div style={{ display: "flex", gap: "8px" }}>
                  <IonSearchbar placeholder="Search by Club Name" className="club-searchbar" />
                  <IonSearchbar placeholder="Search by Location" className="loc-searchbar" />
                </div>
              </IonCol>

              {/* Joined Clubs */}
              <IonCol size="12" sizeMd="1" className="Dropdown-col">
                <IonSelect placeholder="Joined Clubs" className="filter-select" interface="popover">
                  <IonSelectOption value="all" className="select-option-all">
                    All Clubs
                  </IonSelectOption>
                  <IonSelectOption value="joined" className="select-option-joined">
                    Only Joined
                  </IonSelectOption>
                  <IonSelectOption value="not-joined" className="select-option-not-joined">
                    Not Joined
                  </IonSelectOption>
                </IonSelect>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {/* ✅ Groups Grid */}
        <section className="groups-grid">
          <IonGrid>
            <IonRow>
              {groups.map((group) => (
                <IonCol key={group.id} size="12" sizeMd="6" sizeLg="3">
                  <IonCard
                    className="group-card clickable-card"
                    routerLink={'/group-feed'} // ✅ use routerLink instead of history.push
                  >
                    <img src={group.image} alt={group.name} />
                    <IonCardContent className="card-info">
                      <h3>{group.name}</h3>
                      <p className="location">{group.location}</p>
                      <p className="member-count">{group.members}</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </section>
      </IonContent>
    </IonPage>
  );
};

export default Community;
