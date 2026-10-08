import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchBus, clearCurrent } from '../../store/busSlice'
import { setDraft } from '../../store/bookingSlice'
import { showToast } from '../../store/uiSlice'
import SeatGrid from '../../components/SeatGrid'
import { Loading, ErrorBox } from '../../components/State'
import { fmtDateTime, fmtDuration, money } from '../../utils/format'
import { getStopsForCity } from '../../utils/stopsData'

export default function SeatSelection() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((s) => s.auth.user)
  const { current: bus, loading, error } = useSelector((s) => s.buses)

  const [selected, setSelected] = useState([])
  const [passengers, setPassengers] = useState({}) // { [seatNo]: { name, gender, passengerType, womenPreference } }

  const [pickupStops, setPickupStops] = useState([])
  const [dropStops, setDropStops] = useState([])
  const [selectedPickup, setSelectedPickup] = useState(null)
  const [selectedDrop, setSelectedDrop] = useState(null)

  const [medicalAssistance, setMedicalAssistance] = useState(false)
  const [medicalIssueDetails, setMedicalIssueDetails] = useState('')

  const load = () => dispatch(fetchBus(id))
  useEffect(() => { load(); return () => dispatch(clearCurrent()) }, [id])

  useEffect(() => {
    if (bus) {
      const arrTime = bus.arrivalTime || new Date(new Date(bus.departureTime).getTime() + (bus.durationMinutes || 300) * 60000).toISOString()
      const pStops = getStopsForCity(bus.source, 'pickup', bus.departureTime)
      const dStops = getStopsForCity(bus.destination, 'drop', arrTime)
      setPickupStops(pStops)
      setDropStops(dStops)
      setSelectedPickup(pStops[0])
      setSelectedDrop(dStops[0])
    }
  }, [bus])

  // Sync passengers state whenever selected seats change
  useEffect(() => {
    setPassengers((prev) => {
      const updated = { ...prev }
      selected.forEach((seatNo, idx) => {
        if (!updated[seatNo]) {
          const isPink = bus?.womenPreferredSeats?.includes(seatNo)
          updated[seatNo] = {
            name: idx === 0 ? (user?.name || '') : '',
            gender: isPink ? 'Female' : 'Female',
            passengerType: selected.length > 1 ? 'Family' : 'Individual',
            womenPreference: isPink ? true : false,
          }
        }
      })
      // remove unselected seats
      Object.keys(updated).forEach((key) => {
        if (!selected.includes(Number(key))) delete updated[key]
      })
      return updated
    })
  }, [selected, user, bus])

  if (error) return <><Link to="/customer" className="back">← All buses</Link><ErrorBox message={error} onRetry={load} /></>
  if (loading || !bus) return <Loading text="Loading seat map…" />

  const toggle = (n) => {
    const isPink = bus?.womenPreferredSeats?.includes(n)
    if (!selected.includes(n) && isPink) {
      dispatch(showToast({ text: `Seat ${n} is next to women booked seat. Warning: prefered for womens only.` }))
    }
    setSelected((s) => {
      if (s.includes(n)) {
        return s.filter((x) => x !== n)
      } else {
        return [...s, n].sort((a, b) => a - b)
      }
    })
  }

  const unavailable = bus.status !== 'ACTIVE'

  // Helper to keep group seats together (find consecutive available seats)
  const autoSelectGroup = (count) => {
    const bookedSet = new Set(bus.bookedSeats || [])
    const total = bus.totalSeats || 40
    let found = []

    // Try to find consecutive seats in the same row (row size = 4)
    for (let r = 0; r < Math.ceil(total / 4); r++) {
      const rowSeats = [r * 4 + 1, r * 4 + 2, r * 4 + 3, r * 4 + 4].filter(s => s <= total)
      const freeInRow = rowSeats.filter(s => !bookedSet.has(s))
      if (freeInRow.length >= count) {
        found = freeInRow.slice(0, count)
        break
      }
    }

    // Fallback: any available seats across rows
    if (found.length < count) {
      const allFree = []
      for (let s = 1; s <= total; s++) {
        if (!bookedSet.has(s)) allFree.push(s)
      }
      if (allFree.length >= count) {
        found = allFree.slice(0, count)
      }
    }

    if (found.length === count) {
      setSelected(found)
      dispatch(showToast({ text: `Auto-selected ${count} group seats: ${found.join(', ')}` }))
    } else {
      dispatch(showToast({ type: 'error', text: `Could not find ${count} seats together` }))
    }
  }

  const updatePassenger = (seatNo, field, val) => {
    const isPink = bus?.womenPreferredSeats?.includes(seatNo)
    if (field === 'gender') {
      if (val === 'Male' && isPink) {
        window.alert('warning: prefered for womens only')
        dispatch(showToast({ type: 'error', text: 'warning: prefered for womens only' }))
        return
      }
      if (val === 'Female') {
        setPassengers((prev) => ({
          ...prev,
          [seatNo]: {
            ...prev[seatNo],
            gender: 'Female',
            womenPreference: isPink ? true : prev[seatNo]?.womenPreference,
          },
        }))
        return
      }
    }

    if (field === 'womenPreference') {
      if (!val && isPink) {
        window.alert('warning: prefered for womens only')
        dispatch(showToast({ type: 'error', text: 'warning: prefered for womens only' }))
        return
      }
      setPassengers((prev) => ({
        ...prev,
        [seatNo]: {
          ...prev[seatNo],
          womenPreference: val,
          gender: val ? 'Female' : prev[seatNo]?.gender,
        },
      }))
      return
    }

    setPassengers((prev) => ({
      ...prev,
      [seatNo]: {
        ...prev[seatNo],
        [field]: val,
      },
    }))
  }

  const proceed = () => {
    if (!selected.length) return dispatch(showToast({ type: 'error', text: 'Select at least one seat' }))
    if (!selectedPickup) return dispatch(showToast({ type: 'error', text: 'Select a boarding pick-up point' }))
    if (!selectedDrop) return dispatch(showToast({ type: 'error', text: 'Select a dropping point' }))

    // Validate each passenger
    for (const seatNo of selected) {
      const p = passengers[seatNo]
      if (!p || !p.name.trim()) {
        return dispatch(showToast({ type: 'error', text: `Enter passenger name for Seat ${seatNo}` }))
      }

      const isPink = bus.womenPreferredSeats?.includes(seatNo)
      if (isPink) {
        if (p.gender === 'Male' || !p.womenPreference) {
          window.alert('warning: prefered for womens only')
          dispatch(showToast({
            type: 'error',
            text: 'warning: prefered for womens only',
          }))
          return
        }
      }
    }

    // Intra-selection check: if one seat has women preference, adjacent seat cannot be Male
    for (const s1 of selected) {
      const p1 = passengers[s1]
      const isWomenPref1 = !!p1?.womenPreference
      if (isWomenPref1) {
        let adj = null
        if (s1 % 4 === 1) adj = s1 + 1
        else if (s1 % 4 === 2) adj = s1 - 1
        else if (s1 % 4 === 3) adj = s1 + 1
        else if (s1 % 4 === 0) adj = s1 - 1

        if (adj && selected.includes(adj)) {
          const p2 = passengers[adj]
          if (p2?.gender === 'Male') {
            window.alert('warning: prefered for womens only')
            dispatch(showToast({
              type: 'error',
              text: `Seat ${adj} is next to women booked Seat ${s1}. warning: prefered for womens only`,
            }))
            return
          }
        }
      }
    }

    if (medicalAssistance && !medicalIssueDetails.trim()) {
      return dispatch(showToast({ type: 'error', text: 'Please describe the medical issue or assistance required' }))
    }

    const passengerList = selected.map((seatNo) => ({
      seatNumber: seatNo,
      name: passengers[seatNo]?.name?.trim() || user?.name || 'Passenger',
      gender: passengers[seatNo]?.gender || 'Female',
      passengerType: passengers[seatNo]?.passengerType || 'General Passenger',
      womenPreference: !!passengers[seatNo]?.womenPreference || bus.womenPreferredSeats?.includes(seatNo),
    }))

    dispatch(setDraft({
      bus,
      seats: selected,
      passengers: passengerList,
      pickupPoint: selectedPickup,
      dropPoint: selectedDrop,
      medicalAssistance,
      medicalIssueDetails: medicalAssistance ? medicalIssueDetails.trim() : '',
    }))
    navigate('/customer/checkout')
  }

  return (
    <>
      <Link to="/customer" className="back">← All buses</Link>
      <div className="page-head">
        <div>
          <h1>{bus.name}</h1>
          <p className="muted">{bus.source} → {bus.destination} · {fmtDateTime(bus.departureTime)} · {fmtDuration(bus.durationMinutes)}</p>
        </div>
      </div>
      {unavailable && <div className="alert alert-error">This bus has been cancelled and can no longer be booked.</div>}
      
      <div className="two-col seat-layout">
        <div className="stack">
          {/* Seat Grid Panel */}
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Choose your seats</h3>
                <small className="muted">{bus.availableSeats} of {bus.totalSeats} free</small>
              </div>
              <div className="head-actions" style={{ gap: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }} className="muted">Group seats:</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => autoSelectGroup(2)}>2 Seats</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => autoSelectGroup(3)}>3 Seats</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => autoSelectGroup(4)}>4 Seats</button>
              </div>
            </div>
            <SeatGrid
              total={bus.totalSeats}
              booked={bus.bookedSeats || []}
              womenBooked={bus.womenBookedSeats || []}
              womenPreferred={bus.womenPreferredSeats || []}
              selected={selected}
              onToggle={toggle}
              readOnly={unavailable}
            />
          </section>

          {/* Passenger Details Form */}
          {selected.length > 0 && (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>Passenger Details ({selected.length} seat{selected.length > 1 ? 's' : ''})</h3>
                  <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>Enter details for each passenger. Gender and Women Preference options are optional per passenger.</p>
                </div>
              </div>

              <div className="stack">
                {selected.map((seatNo) => {
                  const p = passengers[seatNo] || {}
                  const isPink = bus.womenPreferredSeats?.includes(seatNo)

                  return (
                    <div key={seatNo} className="passenger-card">
                      <div className="passenger-card-head">
                        <b>💺 Seat {seatNo}</b>
                        {isPink && <span className="women-badge" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>🩶 Grey Seat: Women Preferred</span>}
                      </div>

                      <div className="form">
                        <div className="grid-2">
                          <label>
                            Passenger Name *
                            <input
                              value={p.name || ''}
                              onChange={(e) => updatePassenger(seatNo, 'name', e.target.value)}
                              placeholder="Full Name"
                            />
                          </label>

                          <label>
                            Gender *
                            <select
                              value={p.gender || 'Female'}
                              onChange={(e) => {
                                if (isPink && e.target.value === 'Male') {
                                  window.alert('warning: prefered for womens only')
                                  dispatch(showToast({ type: 'error', text: 'warning: prefered for womens only' }))
                                  return
                                }
                                updatePassenger(seatNo, 'gender', e.target.value)
                              }}
                            >
                              <option value="Female">Female</option>
                              {isPink ? (
                                <option value="Male" disabled>Male (Disabled - prefered for womens only)</option>
                              ) : (
                                <option value="Male">Male</option>
                              )}
                            </select>
                          </label>
                        </div>

                        <div className="grid-2">
                          <label>
                            Passenger Type
                            <select
                              value={p.passengerType || 'Individual'}
                              onChange={(e) => updatePassenger(seatNo, 'passengerType', e.target.value)}
                            >
                              <option value="Individual">Individual</option>
                              <option value="Friends">Friends</option>
                              <option value="Family">Family</option>
                              <option value="Group">Group</option>
                            </select>
                          </label>

                          <div style={{ display: 'flex', alignItems: 'center', paddingTop: '1.2rem' }}>
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={!!p.womenPreference}
                                disabled={isPink}
                                onChange={(e) => updatePassenger(seatNo, 'womenPreference', e.target.checked)}
                              />
                              <span>Women Passenger Preference</span>
                            </label>
                          </div>
                        </div>

                        {isPink && (
                          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.6rem' }}>
                            ⚠️ Warning: prefered for womens only (grey seat next to women booked pink seat). Men cannot book this seat.
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Boarding and Dropping Stops Selection */}
          <section className="panel stops-section">
            <div className="panel-head">
              <div>
                <h3>Pick-up &amp; Dropping Points</h3>
                <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>Select boarding stop for {bus.source} and dropping stop for {bus.destination}</p>
              </div>
            </div>
            
            <div className="stops-grid">
              <div className="stop-group">
                <h4 className="stop-title">📍 Pick-up Points in {bus.source} ({pickupStops.length} stops)</h4>
                <div className="stop-options">
                  {pickupStops.map((stop) => (
                    <label key={stop.id} className={`stop-card ${selectedPickup?.id === stop.id ? 'on' : ''}`}>
                      <input
                        type="radio"
                        name="pickup"
                        checked={selectedPickup?.id === stop.id}
                        onChange={() => setSelectedPickup(stop)}
                      />
                      <div className="stop-info">
                        <div className="stop-head">
                          <b>{stop.name}</b>
                          <span className="stop-time">{stop.time}</span>
                        </div>
                        <small className="muted">{stop.landmark}</small>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="stop-group">
                <h4 className="stop-title">🚩 Dropping Points in {bus.destination} ({dropStops.length} stops)</h4>
                <div className="stop-options">
                  {dropStops.map((stop) => (
                    <label key={stop.id} className={`stop-card ${selectedDrop?.id === stop.id ? 'on' : ''}`}>
                      <input
                        type="radio"
                        name="drop"
                        checked={selectedDrop?.id === stop.id}
                        onChange={() => setSelectedDrop(stop)}
                      />
                      <div className="stop-info">
                        <div className="stop-head">
                          <b>{stop.name}</b>
                          <span className="stop-time">{stop.time}</span>
                        </div>
                        <small className="muted">{stop.landmark}</small>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Medical Issues / Special Assistance Section */}
          <section className="panel medical-panel">
            <div className="panel-head">
              <div>
                <h3>🚑 Medical Issues / Special Assistance</h3>
                <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                  Please let us know if any passenger requires mobility aid, medical care, or special attention during travel.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '0.6rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.6rem', color: 'var(--ink)' }}>
                Is there any medical issue or special assistance required for this trip?
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="medicalAssist"
                    checked={!medicalAssistance}
                    onChange={() => { setMedicalAssistance(false); setMedicalIssueDetails('') }}
                  />
                  <span>No</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: '#c2410c' }}>
                  <input
                    type="radio"
                    name="medicalAssist"
                    checked={medicalAssistance}
                    onChange={() => setMedicalAssistance(true)}
                  />
                  <span>Yes, assistance required</span>
                </label>
              </div>

              {medicalAssistance && (
                <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '12px', padding: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem', color: '#9a3412' }}>
                    Describe the medical condition or assistance needed: *
                  </label>
                  <textarea
                    className="input"
                    rows="3"
                    placeholder="e.g. Wheelchair assistance required at boarding, elderly mobility assistance, diabetic medication refrigeration, asthma/inhaler support..."
                    value={medicalIssueDetails}
                    onChange={(e) => setMedicalIssueDetails(e.target.value)}
                    style={{ width: '100%', background: '#fff', resize: 'vertical', fontSize: '0.9rem' }}
                    required
                  />

                  <div style={{ marginTop: '0.6rem' }}>
                    <small style={{ fontWeight: 700, color: '#9a3412', display: 'block', marginBottom: '0.3rem' }}>
                      Quick Suggestions (click to add):
                    </small>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {[
                        '♿ Wheelchair Assistance',
                        '🚶 Elderly Mobility Support',
                        '💉 Diabetic / Medication Storage',
                        '🫁 Asthma / Respiratory Support',
                        '👁️ Visual / Hearing Assistance',
                        '🤰 Pregnancy Care',
                      ].map((item) => (
                        <button
                          key={item}
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', background: '#fff', border: '1px solid #fdba74' }}
                          onClick={() => {
                            setMedicalIssueDetails((prev) => prev ? `${prev}, ${item}` : item)
                          }}
                        >
                          + {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p style={{ margin: '0.6rem 0 0', fontSize: '0.8rem', color: '#c2410c' }}>
                    ℹ️ This information will be visible to the administrator and bus crew to arrange necessary assistance.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="panel summary">
          <div className="panel-head"><h3>Your selection</h3></div>
          <dl className="sum-list">
            <div><dt>Bus type</dt><dd>{bus.busType}</dd></div>
            <div><dt>Fare per seat</dt><dd>{money(bus.fare)}</dd></div>
            <div><dt>Selected Seats</dt><dd>{selected.length ? selected.join(', ') : '—'}</dd></div>
            <div>
              <dt>Pick-up</dt>
              <dd className="sum-stop">
                {selectedPickup ? (
                  <>
                    <b>{selectedPickup.name}</b>
                    <small>({selectedPickup.time})</small>
                  </>
                ) : '—'}
              </dd>
            </div>
            <div>
              <dt>Drop-off</dt>
              <dd className="sum-stop">
                {selectedDrop ? (
                  <>
                    <b>{selectedDrop.name}</b>
                    <small>({selectedDrop.time})</small>
                  </>
                ) : '—'}
              </dd>
            </div>
            {medicalAssistance && (
              <div>
                <dt>Special Aid</dt>
                <dd style={{ color: '#c2410c', fontWeight: 700 }}>🚑 Medical Assist</dd>
              </div>
            )}
          </dl>
          <div className="sum-total"><span>Total</span><b>{money(bus.fare * selected.length)}</b></div>
          <button className="btn btn-primary btn-block" disabled={!selected.length || unavailable} onClick={proceed}>
            Proceed to payment ({money(bus.fare * selected.length)})
          </button>
        </aside>
      </div>
    </>
  )
}
