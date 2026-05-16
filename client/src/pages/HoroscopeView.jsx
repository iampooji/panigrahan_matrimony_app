import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getProfile } from "../logic/profiles.logic";
import { getAttachments } from "../logic/attachments.logic";
import { getFamily } from "../logic/family.logic";
import { loadFormEnums } from "../logic/enumStore";
import { getAddresses } from "../logic/address.logic";
import { getOccupation } from "../logic/occupation.logic";
import HoroscopeTemplate from "./profiles/HoroscopeTemplate_Temp";




export default function HoroscopeView() {
  const { id } = useParams();

  const [profile, setProfile] = useState(null);
  const [images, setImages] = useState([]);
  const [family, setFamily] = useState([]);
  const [address, setAddress] = useState(null);
  const [occupation, setOccupation] = useState(null);
  const [enums, setEnums] = useState(null);

  useEffect(() => {
    loadFormEnums("profile").then(setEnums);
  }, []);

  useEffect(() => {
    getProfile(id).then(setProfile);
    getAttachments("profile", id).then(setImages);
  }, [id]);

  useEffect(() => {
    if (!profile?.id || !enums) return;

    getFamily(profile.id).then(rows => {
      setFamily(
        rows.map(r => ({
          ...r,
          relationLabel: enums.relationtype.map[r.relationtype]
        }))
      );
    });

    // TODO: fetch address & occupation (same APIs used by sections)

  }, [profile?.id, enums]);

  useEffect(() => {
  if (!profile?.id) return;

  getAddresses("profile", profile.id).then(rows => {
  setAddress(rows?.[0] || null);
});

 getOccupation("profile", profile.id).then(setOccupation);

}, [profile?.id]);



  if (!profile) return <p>Loading horoscope...</p>;

  return (
    <HoroscopeTemplate
      profile={profile}
      address={address}
      occupation={occupation}
      family={family}
      photos={images}
      enums={enums}
    />
  );
}
