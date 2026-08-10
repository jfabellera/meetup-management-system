import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { randomUUID } from '@/lib/utils';
import { type PlaceSuggestionInfo } from '@keebmeet/shared';
import { useEffect, useState, type ReactNode } from 'react';
import {
  useAddressAutocompleteQuery,
  useLazyPlaceDetailsQuery,
  useVenueAtPlaceQuery,
} from '../../store/meetupSlice';

interface Props {
  id?: string;
  address: string;
  onAddressChange: (address: string) => void;
  onPlaceSelect: (place: { address: string; venueName: string }) => void;
  onBlur?: () => void;
  invalid?: boolean;
}

type AddressOption = PlaceSuggestionInfo & {
  resolved?: { address: string; venueName: string };
};

const MIN_QUERY_LENGTH = 3;

const AddressCombobox = ({
  id,
  address,
  onAddressChange,
  onPlaceSelect,
  onBlur,
  invalid,
}: Props): ReactNode => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [session, setSession] = useState(() => randomUUID());
  const [fetchPlaceDetails] = useLazyPlaceDetailsQuery();

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const skip = debouncedQuery.trim().length < MIN_QUERY_LENGTH;
  const { data } = useAddressAutocompleteQuery(
    { q: debouncedQuery, session },
    { skip }
  );
  const suggestions = skip ? [] : (data?.suggestions ?? []);

  const addressPlaceId =
    suggestions[0] != null && !suggestions[0].is_establishment
      ? suggestions[0].place_id
      : null;
  const { data: venueAtAddress } = useVenueAtPlaceQuery(
    { placeId: addressPlaceId ?? '' },
    { skip: addressPlaceId == null }
  );

  const options: AddressOption[] =
    addressPlaceId != null && venueAtAddress != null
      ? [
          {
            place_id: `venue-at-${addressPlaceId}`,
            main_text: venueAtAddress.venue_name ?? '',
            secondary_text: venueAtAddress.address,
            is_establishment: true,
            resolved: {
              address: venueAtAddress.address,
              venueName: venueAtAddress.venue_name ?? '',
            },
          },
          ...suggestions,
        ]
      : suggestions;

  const onSelect = async (suggestion: AddressOption | null): Promise<void> => {
    if (suggestion == null) return;
    if (suggestion.resolved != null) {
      onPlaceSelect(suggestion.resolved);
      return;
    }
    setSession(randomUUID());
    const details = await fetchPlaceDetails({
      placeId: suggestion.place_id,
      session,
    })
      .unwrap()
      .catch(() => null);
    onPlaceSelect(
      details != null
        ? { address: details.address, venueName: details.venue_name ?? '' }
        : {
            address: `${suggestion.main_text}, ${suggestion.secondary_text}`,
            venueName: suggestion.is_establishment ? suggestion.main_text : '',
          }
    );
  };

  return (
    <Combobox
      items={options}
      filter={null}
      autoHighlight
      value={null}
      inputValue={address}
      onInputValueChange={(value: string, eventDetails: { reason: string }) => {
        if (
          eventDetails.reason !== 'input-change' &&
          eventDetails.reason !== 'input-paste'
        ) {
          return;
        }
        setQuery(value);
        onAddressChange(value);
      }}
      onValueChange={(suggestion: AddressOption | null) => {
        void onSelect(suggestion);
      }}
      itemToStringLabel={(suggestion: AddressOption) =>
        `${suggestion.main_text}, ${suggestion.secondary_text}`
      }
    >
      <ComboboxInput
        id={id}
        className="w-full"
        showTrigger={false}
        placeholder="Search for a venue or address"
        aria-invalid={invalid}
        onBlur={onBlur}
      />
      <ComboboxContent>
        <ComboboxEmpty className="px-2">
          {skip ? 'Keep typing to search…' : 'No matches found.'}
        </ComboboxEmpty>
        <ComboboxList>
          {(suggestion: AddressOption) => (
            <ComboboxItem key={suggestion.place_id} value={suggestion}>
              <div className="flex min-w-0 flex-col">
                <span className="truncate">{suggestion.main_text}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {suggestion.secondary_text}
                </span>
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

export default AddressCombobox;
