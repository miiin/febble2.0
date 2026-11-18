type Props = {
  artistName: string;
  spotifyArtistId?: string;
};

// Spotify 아티스트 미리듣기. ID 가 없으면 안내 문구.
export default function SpotifyEmbed({ artistName, spotifyArtistId }: Props) {
  if (!spotifyArtistId) {
    return <p className="border border-black px-3 py-6 text-center text-sm">미리듣기를 준비하고 있어요.</p>;
  }

  return (
    <iframe
      title={`${artistName} Spotify`}
      src={`https://open.spotify.com/embed/artist/${spotifyArtistId}?utm_source=generator`}
      height={152}
      className="w-full rounded-xl"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    />
  );
}
