import React from "react";
import "./HoroscopeTemplate.css";
import AddressSection from "../../components/address/AddressSection";


const HoroscopeTemplate = ({
  profile,
  address,
  occupation,
  family,
  enums,
  photos,
}) => {
  {
  return (
    <div className="page">
      {/* Top Row */}
      <div className="top-row">
        <div className="top-nc">NC</div>
        <div className="top-om text-red bold">
          Om Sri Jakaditestwarys Namhe
        </div>
        <div className="top-se">S E</div>
        <div className="top-code">
          <div>DONI BB</div>
          <div>CODE</div>
        </div>
      </div>

      {/* Header */}
      <div className="pink-header">
        <div className="bold text-red">
          Arya Vysya Kanya Varanveshana Kendra
        </div>
        <div className="bold" style={{ color: "#4a148c" }}>
          Since 1968
        </div>
        <div style={{ fontSize: "10px" }}>
          (ONLY FOR 133 ARYA VASAVI MEMBERS)
        </div>
      </div>

      <div className="yellow-banner">IN SEARCH OF LIFE PARTNER FOR YOU</div>
      <div className="yellow-banner">A UNIT OF 102 ARYA VYSYA JATHAKA MAHASABHA</div>

      <div className="flex-container">
        {/* Left Side */}
        <div className="left-side">
          <table>
            <tbody>
              <tr>
                <td className="label-bg">Place Of Birth</td>
                
                <td className="text-green bold center">{profile?.birthplace}</td>
                <td className="label-bg">Date of Birth</td>
                <td className="text-green bold center">2</td>
                <td className="data-bg center">{profile?.birthdate}</td>
              </tr>

              <tr>
                <td className="label-bg">Day Of Birth</td>
                <td className="text-green bold center">10</td>
                <td className="label-bg">Ayana</td>
                <td className="text-green bold center">2</td>
                <td className="data-bg center">Dakshinayana</td>
              </tr>

              <tr>
                <td className="label-bg">Time Of Birth</td>
                <td className="text-green bold center">{profile?.birthtime}</td>
                <td className="label-bg">Chandra Masa</td>
                <td className="text-green bold center">7</td>
                <td className="data-bg center" colSpan={2}>
                  Asweja
                </td>
              </tr>
              <tr>
                <td className="label-bg">Place of Birth:</td>
                <td>{profile?.birthplace}</td>
                <td className="label-bg">District: </td>
                <td>{profile?.birthdist}</td>
                <td className="label-bg">State: {} {profile?.birthstate}</td>
              </tr>
            </tbody>
          </table>

          {/* Name Strip */}
          <div className="name-strip">
            <div
              className="text-blue"
              style={{ width: "30%", fontSize: "12px" }}
            >
              {profile?.familygod}
              <br />
              (Family God)
            </div>

            <div
              className="text-blue"
              style={{ textAlign: "center", width: "30%", fontSize: "12px" }}
            >
              {profile?.familyname}
              <br />
              (Family Name)
            </div>

            <div
              className="text-red bold"
              style={{ width: "40%", textAlign: "center", fontSize: "24px" }}
            >
              {profile?.firstname} {profile?.lastname}
            </div>

            <div
              className="text-blue bold"
              style={{ width: "30%", textAlign: "right", fontSize: "12px" }}
            >
              {profile?.education2}
              <br />
              {profile?.occupation}
            </div>
          </div>

          {/* Parents */}
          <table>
            <tbody>
              <tr>
                <td className="label-bg">Father Sri</td>
                <td className="data-bg">{profile?.firstname}</td>
                <td className="label-bg">Father Place</td>
                <td className="data-bg">Raichur</td>
              </tr>

              <tr>
                <td className="label-bg">Mother Smt</td>
                <td className="data-bg">{enums?.firstname}</td>
                <td className="label-bg">Mother Place</td>
                <td className="data-bg">{profile?.placeoforigin}</td>
              </tr>
            </tbody>
          </table>
          

          {/* Astro Section */}
          <div className="astro-wrapper">
            <div className="vertical-tag">ASTRO DETAILS</div>

            <div className="kundali-grid">
              {/* <div className="k-cell" />
              <div className="k-cell">
                Lagna
                <br />
                Chandra
                <br />
                Shani
              </div>
              <div className="k-cell">
                Guru
                <br />
                Rahu
              </div>
              <div className="k-cell" />

              <div className="k-cell text-red">Star</div>
              <div className="k-cell">Kruthika</div>
              <div
                className="k-cell"
                style={{ gridColumn: "span 2", fontSize: "12px" }}
              >
                {profile?.email}
              </div>

              <div className="k-cell text-red">Pada</div>
              <div className="k-cell">{profile?.starpada}</div>
              <div className="k-cell text-red"></div>
              <div className="k-cell"></div>

              <div className="k-cell text-red">Rasi</div>
              <div className="k-cell">{profile?.birthrasi}</div>
              <div className="k-cell">Ravi</div>
              <div className="k-cell">
                Budha
                <br />
                Shukra
              </div> */}
              <div >
                <img src={`http://localhost:8080${photos?.[5]?.file_url}`}  alt="Kundali" className="kundali-img"/></div>
            </div>

            <div class="email-vertical">
              Email: {profile?.email}
            </div>

            
            <div style={{ width: "37%", borderLeft: "1px solid #000" }}>
              <table>
                <tbody>
                  <tr>
                    <td className="label-bg">Father</td>
                    <td className="data-bg">Yes</td>
                  </tr>
                  <tr>
                    <td className="label-bg">Mother</td>
                    <td className="data-bg">Yes</td>
                  </tr>
                  <tr>
                    <td className="label-bg">E-Broth</td>
                    <td className="data-bg">{profile?.broe}</td>
                  </tr>
                  <tr>
                    <td className="label-bg">Y-Broth</td>
                    <td className="data-bg">{profile?.broy}</td>
                  </tr>
                  <tr>
                    <td className="label-bg">E-Sister</td>
                    <td className="data-bg">{profile?.sise}</td>
                  </tr>
                  <tr>
                    <td className="label-bg">Y-Sister</td>
                    <td className="data-bg">{profile?.sisy}</td>
                  </tr>
                  <tr>
                    <td className="label-bg">Twin?</td>
                    <td className="data-bg">{profile?.hastwin}</td>
                  </tr>
                  <tr>
                    <td className="label-bg">Height</td>
                    <td className="data-bg">{profile?.height}</td>
                  </tr>
                  <tr>
                    <td className="label-bg">Education</td>
                    <td className="data-bg">{profile?.education1} <br></br>{profile?.education2}</td>
                  </tr>
                  <tr>
                    <td className="label-bg">Occupation</td>
                    <td className="data-bg">{profile?.occupation}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="center bold" style={{ background: "#ffff00", padding: "3px", borderTop: "1px solid #000", width:"100%"}}>
        Advisors & Astro Matrimonial Consultant AVKVK 9844085118, 9008484741
      </div>
        </div>

        {/* Right Side */}
        <div className="right-side">
          <div
            className="text-red bold"
            style={{ fontSize: "16px", margin: "5px 0" }}
          >
            REGISTRATION NO: {profile.id}
          </div>

          
          <b>PROFILE PHOTO</b>
          <div className="frame" style={{ height:"200px" , backgroundColor: "yellow"}}>
            <img src={`http://localhost:8080${photos?.[1]?.file_url}`}  alt="Profile" className="profile-img"/>
          </div>

          <b>PROFILE PHOTO:- 2</b>
          <div
            className="frame" style={{ height: "180px", borderColor: "red", backgroundColor: "burlywood"}}>
              <img src={`http://localhost:8080${photos?.[2]?.file_url}`} alt="Profile" className="profile-img"/>
          </div>

          <div style={{ border: "1px solid #000", padding: "2px" }}>
            <span className="text-blue bold">Tally Sheet No:</span>
            <span style={{ border: "1px solid #000", padding: "0 10px" }}>
              F
            </span>
            <span style={{ border: "1px solid #000", padding: "0 10px" }}>
              4
            </span>
          </div>

          <div className="text-blue bold" style={{ marginTop: "5px", fontSize: "16px" }}>
            Looking for Good Family
          </div>

          <div
            className="frame" style={{ height: "180px", borderColor: "red", backgroundColor: "aqua"}}>
              <img src={`http://localhost:8080${photos?.[3]?.file_url}`} alt="Profile" className="profile-img"/>
          </div>
          <b>Parents Photo</b>
        </div>
      </div>

      {/* ================= BOTTOM SECTIONS ================= */}
      

      <div style={{ display: "flex", borderTop: "1px solid #000", height: "120px" }}>
        <div style={{ width: "50%", padding: "10px", borderRight: "1px solid #000" }}>
          {/* <div className="text-red bold center">Sul Kely Sri, Mam Hon Svi</div>
          <div className="dot-line"></div> */}
          {/* <div className="center" style={{ fontSize: "30px" }}>
            Family God: {profile?.familygod}
          </div> */}
        </div>

        <div
          style={{
            width: "50%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >

          <div className="text-red bold" style={{ fontSize: "24px" }}>
            BENGALURU
          </div>
        </div>
      </div>

      <div className="address-box">
        <div style={{ width: "20%" }} className="text-red bold">
          Residential Address:-
        </div>
        {/* <AddressSection relationtype="profile" relationid={profile.id} /> */}
        <div style={{ width: "80%" }} className="text-blue bold">
        </div>
      </div>

      <div style={{ padding: "10px", borderTop: "1px dashed #000", display: "flex" }}>
        <div style={{ width: "20%" }} className="text-red bold">
          Y Brother:
        </div>
        <div style={{ width: "80%" }} className="text-blue bold">
          Katkam Vishnu Pursuing B.Tech. At BIT Bangalore
        </div>
      </div>

      <div className="footer-note">
        Thanks for Utilizing our Services. Please contact:- 9008484741, 9844085118 for New Registration or CLICK here:- <p>&#128071;</p><a href="https://maps.app.goo.gl/zLThjTutTnnzYENF9?g_st=aw">For Bangalore Office</a>
      </div>
    </div>
  );
};
};
  

export default HoroscopeTemplate;
